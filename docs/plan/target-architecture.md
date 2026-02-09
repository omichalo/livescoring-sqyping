# Target Architecture Design

## Domain Model

### Core Concepts

```
Physical Table (table: number)
  ↓ (mapped via)
Broadcast Session (venue + date)
  ↓ (defines)
Slot Mapping (slotId → table)
  ↓ (used by)
Streaming Slot (slotId: string - configured per session, examples: "A", "B", "C", "D")
```

### Entity Relationships

```
BroadcastSession
  ├── venueId: string
  ├── venueName: string
  ├── date: string (ISO date)
  ├── startTime: number (timestamp)
  ├── endTime?: number (timestamp)
  ├── status: "scheduled" | "active" | "completed"
  └── slotMappings: SlotMapping[]
      ├── slotId: string (configured per session, examples: "A", "B", "C", "D")
      ├── physicalTable: number
      ├── cameraKitId?: string
      ├── obsInstanceId?: string
      └── isActive: boolean

Match (enhanced)
  ├── ...existing fields...
  ├── table: number (PRESERVED - physical table)
  ├── slotId?: string (NEW - streaming slot)
  └── broadcastSessionId?: string (NEW - session context)

Command (NEW - TOP-LEVEL COLLECTION)
  ├── id: string
  ├── venueId: string (REQUIRED - for scoping)
  ├── broadcastSessionId: string (REQUIRED - for scoping)
  ├── slotId: string (REQUIRED - for scoping)
  ├── type: "obs_scene_switch" | "obs_source_visibility" | "obs_stream_start" | "obs_stream_stop" | "youtube_go_live"
  ├── payload: Record<string, unknown>
  ├── status: "pending" | "processing" | "completed" | "failed"
  ├── createdAt: number
  ├── processedAt?: number
  ├── processedBy?: string (agentId)
  └── error?: string

AgentHeartbeat (NEW - TOP-LEVEL COLLECTION)
  ├── agentId: string (unique per Tauri instance, also used as document ID)
  ├── venueId: string (REQUIRED - for scoping)
  ├── broadcastSessionId: string (REQUIRED - for scoping)
  ├── slotId: string (REQUIRED - for scoping)
  ├── obsStatus: "connected" | "disconnected" | "error"
  ├── lastSeen: number (timestamp)
  ├── capabilities: string[] (e.g., ["obs", "youtube"])
  └── metadata?: Record<string, unknown>
```

## Firestore Schema Additions

### Collection: `broadcastSessions`

```typescript
interface BroadcastSession {
  id: string;
  venueId: string;
  venueName: string;
  date: string; // ISO date "2024-01-15"
  startTime: number; // Unix timestamp
  endTime?: number;
  status: "scheduled" | "active" | "completed";
  slotMappings: SlotMapping[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string; // User ID
}

interface SlotMapping {
  slotId: string; // Configured per session (examples: "A", "B", "C", "D" but not limited to these)
  physicalTable: number;
  cameraKitId?: string;
  obsInstanceId?: string;
  isActive: boolean;
}
```

**Indexes needed:**
- `venueId` + `date` (ASC) - For finding sessions by venue/date
- `venueId` + `date` + `status` (ASC) - For finding active session per venue/date
- `status` + `date` (ASC) - For general session queries

**Multi-Venue Concurrency Rule:**
- Only ONE active broadcast session per venue per date is allowed (HARD rule)
- Session activation MUST be **transactional** using the `activeSessions` lock collection (see below); do not rely on "query other actives then update"

### Collection: `activeSessions` (TOP-LEVEL – LOCK FOR CONCURRENCY)

**Purpose:** Enforce uniqueness of active session per venue per date via a single lock document. Prevents race conditions when two admins activate different sessions for the same venue/date.

**Document ID:** `{venueId}_{dateKey}` where `dateKey` is ISO date YYYY-MM-DD (e.g. Europe/Paris date).

**Fields:**
```typescript
interface ActiveSessionLock {
  venueId: string;
  dateKey: string;       // YYYY-MM-DD
  broadcastSessionId: string;
  updatedAt: Timestamp;  // serverTimestamp (REQUIRED for ordering)
}
```

**Activation algorithm (activateSession):**
1. Read `broadcastSessions/{sessionId}` to get `venueId` and `date` (use as dateKey).
2. Run a **Firestore transaction**:
   - Set `activeSessions/{venueId}_{dateKey}` to `{ venueId, dateKey, broadcastSessionId: sessionId, updatedAt: serverTimestamp() }`.
   - Set `broadcastSessions/{sessionId}.status` = `"active"`.
   - Optionally read current lock and if `broadcastSessionId` was different, set previous `broadcastSessions/{previousId}.status` = `"completed"`.
3. No separate "query other actives then update" – the lock doc is the single source of truth.

**Indexes:** None required (single-doc read/write by ID).

### Collection: `commands` (TOP-LEVEL COLLECTION)

**Important:** This is a top-level collection, not a subcollection. All commands include `venueId`, `broadcastSessionId`, and `slotId` for scoping.

```typescript
interface Command {
  id: string;
  venueId: string;       // REQUIRED - for multi-venue scoping
  broadcastSessionId: string; // REQUIRED - for session scoping
  slotId: string;        // REQUIRED - for slot scoping (examples: "A", "B", "C", "D")
  type: CommandType;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Timestamp;  // serverTimestamp (REQUIRED – for ordering)
  // Leasing & idempotence (safe under duplicate consumers):
  processedBy?: string;  // agentId that claimed/processed the command
  leaseUntil?: Timestamp; // serverTimestamp – claim expires after this (e.g. now + 30s)
  attemptCount?: number; // incremented on each claim
  lastError?: string;    // last failure message
  completedAt?: Timestamp; // serverTimestamp when status became completed/failed
}

type CommandType =
  | "obs_scene_switch"
  | "obs_source_visibility"
  | "obs_stream_start"
  | "obs_stream_stop"
  | "obs_source_mute"
  | "youtube_go_live"
  | "youtube_set_title"
  | "youtube_set_description";
```

**Indexes needed:**
- `venueId` + `broadcastSessionId` + `slotId` + `status` + `createdAt` (ASC) - Primary query pattern
- `venueId` + `broadcastSessionId` + `slotId` + `status` (ASC) - For filtering by slot
- `status` + `createdAt` (ASC) - For general pending command queries

**Claim command (transaction):** To avoid duplicate processing, agents MUST "claim" a command in a **transaction**:
- Allowed if `status === "pending"` OR (`status === "processing"` AND `leaseUntil < now`).
- In the transaction: set `status = "processing"`, `processedBy = agentId`, `leaseUntil = now + 30s` (serverTimestamp), `attemptCount` incremented.
- Commands must be **idempotent**: use set/absolute actions (e.g. switch to scene X), never toggle.

**Query Pattern:**
```typescript
// Tauri agent queries commands for its assigned slot (pending or stale lease)
query(
  collection(db, "commands"),
  where("venueId", "==", venueId),
  where("broadcastSessionId", "==", sessionId),
  where("slotId", "==", slotId),
  where("status", "in", ["pending", "processing"]), // processing with expired lease handled in claim
  orderBy("createdAt", "asc")
)
```

### Collection: `agentHeartbeats` (TOP-LEVEL COLLECTION)

**Important:** This is a top-level collection, not a subcollection. All heartbeats include `venueId`, `broadcastSessionId`, and `slotId` for scoping.

```typescript
interface AgentHeartbeat {
  agentId: string;       // Unique per Tauri instance (also document ID)
  venueId: string;       // REQUIRED - for multi-venue scoping
  broadcastSessionId: string; // REQUIRED - for session scoping
  slotId: string;        // REQUIRED - for slot scoping (examples: "A", "B", "C", "D")
  obsStatus: "connected" | "disconnected" | "error";
  lastSeen: Timestamp;   // serverTimestamp (REQUIRED – for ordering and staleness)
  capabilities: string[]; // e.g., ["obs", "youtube"]
  // Required for monitoring:
  obsConnected: boolean;
  streaming: boolean;
  version?: string;      // app version
  os?: string;
  metadata?: Record<string, unknown>;
}
```

**Heartbeat cadence:** Send every **10–15 seconds**. **Offline threshold:** 60 seconds (treat agent offline if `lastSeen` older than 60s).

**Indexes needed:**
- `venueId` + `broadcastSessionId` + `slotId` + `lastSeen` (DESC) - Primary query pattern for active agents
- `venueId` + `broadcastSessionId` + `slotId` (ASC) - For finding agent for a specific slot
- `lastSeen` (DESC) - For cleanup of stale agents across all sessions

**Query Pattern:**
```typescript
// Query active agents for a specific slot in a session
query(
  collection(db, "agentHeartbeats"),
  where("venueId", "==", venueId),
  where("broadcastSessionId", "==", sessionId),
  where("slotId", "==", slotId),
  where("lastSeen", ">", fiveMinutesAgo),
  orderBy("lastSeen", "desc")
)
```

### Collection: `matches` (Enhanced)

**Add fields:**
- `slotId?: string` - Streaming slot ID (optional for backward compatibility)
- `broadcastSessionId?: string` - Link to broadcast session (optional)

**Keep existing:**
- `table?: number` - Physical table number (PRESERVED)

**Migration strategy:**
- New fields are optional
- Existing matches continue to work
- New matches can include slotId when assigned via admin

### Timestamps (serverTimestamp)

All ordering and consistency timestamps MUST use Firestore **serverTimestamp** (not client `Date.now()`):

- **commands:** `createdAt`, `completedAt` (when status becomes completed/failed)
- **agentHeartbeats:** `lastSeen`
- **activeSessions:** `updatedAt`

This avoids clock skew and ensures consistent ordering across clients.

### Security model (minimum viable)

- **Auth:** Firebase Auth with custom claims:
  - `role`: `"admin"` | `"operator"`
  - `venueIds`: `string[]` (venues the user/agent can access)
- **Admin:** Can create/activate broadcast sessions and create commands (for allowed venues).
- **Operator (Tauri agent):**
  - Can read commands for allowed `venueIds`.
  - Can update ONLY leasing/status fields on commands (`status`, `processedBy`, `leaseUntil`, `attemptCount`, `lastError`, `completedAt`) – cannot change `venueId`, `broadcastSessionId`, `slotId`, `type`, or `payload`.
  - Can upsert only its own `agentHeartbeats/{agentId}` document (and only for allowed venues).

### VenueId handling

- **No placeholder venueId.** The web app MUST use a concrete venue selection mechanism:
  - Admin chooses venue in UI; selection is persisted in **localStorage** (e.g. via `useVenueSelection` hook).
  - Session lookup, overlay context, and command scoping all use this selected `venueId`.
- Both admin pages and overlay/session lookup use the same selected venue (from hook/localStorage).

## Web App Evolution

### Admin UX Preservation Strategy

**Principle**: Physical tables remain the primary UX element. Slots are a behind-the-scenes abstraction.

#### LiveScoringManagementPage Changes

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  Match Assignment (UNCHANGED)            │
│  [Table 1] [Table 2] [Table 3] [Table 4]│
│  ↓ Click to assign match                │
└─────────────────────────────────────────┘
         ↓ (behind scenes)
┌─────────────────────────────────────────┐
│  Slot Mapping Resolution                 │
│  Table 1 → Slot A (if session active)   │
│  Table 2 → Slot B (if session active)   │
└─────────────────────────────────────────┘
```

**Implementation:**
1. Keep existing table assignment UI unchanged
2. Add slot resolution service:
   ```typescript
   async function resolveSlotForTable(
     table: number,
     encounterId: string
   ): Promise<string | null> {
     // 1. Get active broadcast session for today
     // 2. Find slot mapping for this table
     // 3. Return slotId or null if no mapping
   }
   ```

3. When match assigned to table:
   ```typescript
   // Existing code (preserved)
   await updateDoc(matchRef, {
     status: "inProgress",
     table: tableNumber,
     startTime: Date.now(),
   });
   
   // New code (additive)
   const slotId = await resolveSlotForTable(tableNumber, encounterId);
   if (slotId) {
     await updateDoc(matchRef, {
       slotId: slotId,
       broadcastSessionId: activeSessionId,
     });
   }
   ```

**New UI Elements (Optional):**
- Small badge showing slot assignment: "Table 1 (Slot A)"
- Only visible when broadcast session is active
- Collapsible section for slot management (advanced users)

#### Broadcast Session Management Page (NEW)

**Route:** `/broadcast-sessions` or `/admin/broadcast-sessions`

**Features:**
- Create/edit broadcast sessions
- Configure slot mappings (A/B/C/D → physical tables)
- View active sessions
- Start/stop sessions

**UI Flow:**
1. Select venue (or create new)
2. Select date
3. Map slots to tables:
   ```
   Slot A → [Dropdown: Table 1, Table 2, ...]
   Slot B → [Dropdown: Table 2, Table 3, ...]
   Slot C → [Dropdown: Table 3, Table 4, ...]
   Slot D → [Dropdown: Table 4, Table 1, ...]
   ```
4. Save session
5. Activate session (sets status to "active")

### Overlay Evolution

#### Slot-Based Resolution

**New Service:** `slotResolutionService.ts`

**Important:** Overlay queries use **sequential fallback strategy**, not concurrent listeners.

```typescript
export async function resolveMatchBySlot(
  slotId: string,
  broadcastSessionId?: string
): Promise<Match | null> {
  // Strategy: Sequential fallback, not concurrent queries
  // 1. First try: Query by slotId (preferred)
  const slotQuery = query(
    collection(db, "matches"),
    where("slotId", "==", slotId),
    where("status", "==", "inProgress")
  );
  const slotSnapshot = await getDocs(slotQuery);
  
  if (!slotSnapshot.empty) {
    return slotSnapshot.docs[0].data() as Match;
  }
  
  // 2. Fallback: Resolve slot to table, then query by table
  if (broadcastSessionId) {
    const table = await resolveSlotToTable(slotId, broadcastSessionId);
    if (table) {
      const tableQuery = query(
        collection(db, "matches"),
        where("table", "==", table),
        where("status", "==", "inProgress")
      );
      const tableSnapshot = await getDocs(tableQuery);
      if (!tableSnapshot.empty) {
        return tableSnapshot.docs[0].data() as Match;
      }
    }
  }
  
  return null;
}
```

#### Overlay Route Evolution

**Strategy:** Keep URL structure, add slot resolution layer

**Current:** `/overlay/tv/:table`
**New:** `/overlay/tv/:table` (backward compatible) + `/overlay/slot/:slotId` (new)

**Implementation:**
```typescript
// OverlayTVPage.tsx - Enhanced
export const OverlayTVPage: React.FC = () => {
  const { table, slotId } = useParams<{ table?: string; slotId?: string }>();
  
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const loadMatch = async () => {
      // Strategy: Sequential fallback, NOT concurrent listeners
      
      if (slotId) {
        // First attempt: Query by slotId
        const slotQuery = query(
          collection(db, "matches"),
          where("slotId", "==", slotId),
          where("status", "==", "inProgress")
        );
        const slotSnapshot = await getDocs(slotQuery);
        
        if (!slotSnapshot.empty) {
          // Found match via slotId - set up listener
          const matchRef = slotSnapshot.docs[0].ref;
          unsubscribe = onSnapshot(matchRef, (doc) => {
            setMatch(doc.data() as Match);
          });
          return;
        }
      }
      
      // Fallback: Query by table (legacy)
      if (table) {
        const tableQuery = query(
          collection(db, "matches"),
          where("table", "==", parseInt(table)),
          where("status", "==", "inProgress")
        );
        unsubscribe = onSnapshot(tableQuery, (snapshot) => {
          if (!snapshot.empty) {
            setMatch(snapshot.docs[0].data() as Match);
          }
        });
      }
    };
    
    loadMatch();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [table, slotId]);
};
```

**Key Points:**
- Only ONE Firestore listener active at a time (never run slot and table listeners concurrently).
- **Sequential fallback:** Try slot-based listener first; if the **first snapshot is empty** (or after a short timeout), **unsubscribe** from the slot query, then subscribe to the legacy **table**-based query. Never run both in parallel.
- Slot query takes precedence if both parameters exist; table query is fallback for backward compatibility.

**Migration Path:**
1. Phase 1: Add slot-based routes alongside table routes
2. Phase 2: Update OBS browser sources to use slot routes
3. Phase 3: Deprecate table routes (optional, keep for backward compat)

### Mapping Resolution Service

**File:** `live-scoring/src/services/slotResolutionService.ts`

```typescript
export interface SlotTableMapping {
  slotId: string; // Configured per session (examples: "A", "B", "C", "D")
  physicalTable: number;
  broadcastSessionId: string;
}

export class SlotResolutionService {
  /**
   * Get active broadcast session for a venue and date
   * Enforces: Only ONE active session per venue per date
   */
  static async getActiveSession(
    venueId: string,
    date: string
  ): Promise<BroadcastSession | null>;
  
  /**
   * Resolve slotId to physical table number
   */
  static async resolveSlotToTable(
    slotId: string,
    sessionId: string
  ): Promise<number | null>;
  
  /**
   * Resolve physical table to slotId
   */
  static async resolveTableToSlot(
    table: number,
    sessionId: string
  ): Promise<string | null>;
  
  /**
   * Get all slot mappings for a session
   */
  static async getSlotMappings(
    sessionId: string
  ): Promise<SlotTableMapping[]>;
}
```

## Tauri Control Architecture

### Project Structure

```
tauri-control-app/
├── src/
│   ├── main.rs              # Tauri entry point
│   ├── commands/            # Rust command handlers
│   │   ├── obs.rs           # OBS WebSocket commands
│   │   ├── youtube.rs       # YouTube API (future)
│   │   └── firestore.rs     # Firestore command listener
│   ├── services/
│   │   ├── obs_client.rs    # OBS WebSocket client
│   │   └── command_processor.rs
│   └── state.rs             # Shared application state
├── src-tauri/
│   ├── Cargo.toml
│   └── tauri.conf.json
└── ui/                      # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── SlotControl.tsx
    │   │   ├── OBSStatus.tsx
    │   │   └── CommandQueue.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   └── Settings.tsx
    │   └── hooks/
    │       ├── useSlot.ts
    │       └── useOBS.ts
```

### Rust Command Modules

#### OBS Commands (`commands/obs.rs`)

```rust
#[tauri::command]
pub async fn obs_connect(
    address: String,
    port: u16,
    password: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
pub async fn obs_switch_scene(
    scene_name: String,
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
pub async fn obs_set_source_visibility(
    source_name: String,
    visible: bool,
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
pub async fn obs_start_stream(
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
pub async fn obs_stop_stream(
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
pub async fn obs_get_status(
    state: State<'_, AppState>,
) -> Result<OBSStatus, String>;
```

#### Firestore Command Listener (`commands/firestore.rs`)

```rust
pub async fn listen_to_commands(
    slot_id: String,
    agent_id: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    // 1. Connect to Firestore
    // 2. Query: where("slotId", "==", slot_id) + where("status", "==", "pending")
    // 3. Process commands as they arrive
    // 4. Update command status
    // 5. Send heartbeat updates
}
```

### UI Modules

#### SlotControl Component

```typescript
interface SlotControlProps {
  slotId: string; // Configured per session (examples: "A", "B", "C", "D")
  obsAddress: string;
  obsPort: number;
  obsPassword?: string;
}

export function SlotControl({ slotId, ... }: SlotControlProps) {
  const { connect, disconnect, status } = useOBS();
  const { commands, processCommand } = useCommandQueue(slotId);
  
  return (
    <Card>
      <CardHeader title={`Slot ${slotId}`} />
      <OBSStatus status={status} />
      <CommandQueue commands={commands} />
      <Button onClick={connect}>Connect OBS</Button>
    </Card>
  );
}
```

#### Dashboard Page

```typescript
export function Dashboard() {
  // Slot configuration loaded from broadcast session
  // Examples shown use "A", "B", "C", "D" but any string values are valid
  const [slots, setSlots] = useState<SlotConfig[]>([
    { slotId: "A", obsAddress: "localhost", obsPort: 4455 },
    { slotId: "B", obsAddress: "localhost", obsPort: 4456 },
    { slotId: "C", obsAddress: "localhost", obsPort: 4457 },
    { slotId: "D", obsAddress: "localhost", obsPort: 4458 },
  ]);
  
  return (
    <Grid container spacing={2}>
      {slots.map(slot => (
        <Grid item xs={12} md={6} key={slot.slotId}>
          <SlotControl {...slot} />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Remote Command Mode

**Architecture:**
- Tauri app listens to Firestore `commands` collection (top-level)
- Commands scoped by `venueId + broadcastSessionId + slotId`
- Web app creates commands when matches start/stop
- Tauri processes commands and updates status

**Command Flow:**
```
Web App (Admin)
  ↓ Creates command in Firestore
Firestore: commands/{id} {
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  status: "pending",
  ...
}
  ↓ Tauri app listens (filtered by venueId + sessionId + slotId)
Tauri App (Slot A)
  ↓ Processes command
OBS WebSocket API
  ↓ Executes action
Firestore: commands/{id} {
  status: "completed",
  processedAt: ...,
  processedBy: "agent-789"
}
```

**Heartbeat Flow:**
```
Tauri App (every 5 seconds)
  ↓ Updates heartbeat
Firestore: agentHeartbeats/{agentId} {
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  lastSeen: now,
  obsStatus: "connected",
  ...
}
  ↓ Web app monitors (filtered by venueId + sessionId + slotId)
Web App (Admin)
  ↓ Shows agent status
UI: "Slot A: Active (Agent: obs-instance-1)"
```

## Packaging Layout Per OS

### OBS Portable Packaging

**Structure:**
```
obs-portable-{os}/
├── obs-studio/              # OBS Studio portable
│   ├── bin/
│   ├── data/
│   └── obs-plugins/
├── config/                  # OBS config per slot
│   ├── slot-a/
│   │   └── global.ini
│   ├── slot-b/
│   ├── slot-c/
│   └── slot-d/
├── scripts/
│   ├── start-obs-slot-a.sh  # Start OBS with slot A config
│   ├── start-obs-slot-b.sh
│   └── ...
└── README.md
```

**OS-Specific:**

**Windows:**
- `obs-studio/` - OBS Studio portable installation
- `start-obs-slot-a.bat` - Batch scripts
- `obs-portable-windows.zip` - Distribution package

**macOS:**
- `obs-studio/OBS.app` - OBS Studio app bundle
- `start-obs-slot-a.sh` - Shell scripts
- `obs-portable-macos.tar.gz` - Distribution package

**Linux:**
- `obs-studio/` - OBS Studio AppImage or compiled binaries
- `start-obs-slot-a.sh` - Shell scripts
- `obs-portable-linux.tar.gz` - Distribution package

**Configuration Per Slot:**
- Each slot has separate OBS config directory
- WebSocket ports: 4455 (A), 4456 (B), 4457 (C), 4458 (D)
- Browser source URLs point to slot-specific overlay routes
- Scene names: "Slot A", "Slot B", etc.

### Tauri App Packaging

**Build outputs:**
- Windows: `.exe` installer + portable `.zip`
- macOS: `.dmg` + `.app` bundle
- Linux: `.AppImage` + `.deb` / `.rpm`

**Distribution:**
- GitHub Releases with assets per OS
- Auto-update support via Tauri updater
- Version tagging aligned with web app releases

## YouTube Automation Staged Plan

### Phase 1: Foundation (Not in initial implementation)
- YouTube API credentials setup
- OAuth flow for channel access
- Basic YouTube API client in Rust

### Phase 2: Stream Management
- Command: `youtube_go_live`
- Create live stream event
- Set title/description from match data
- Link stream key to OBS

### Phase 3: Advanced Features
- Auto-schedule streams based on match schedule
- Thumbnail generation from match data
- Chat integration (optional)
- Analytics collection

**Note:** YouTube automation is future work, not blocking initial slot implementation.

## Data Flow Diagrams

### Match Assignment Flow

```
Admin assigns match to Table 1
  ↓
LiveScoringManagementPage.startMatch()
  ↓
Update match: { table: 1, status: "inProgress" }
  ↓
SlotResolutionService.resolveTableToSlot(1, venueId, sessionId)
  ↓
Get active broadcast session (filtered by venueId + date)
  ↓
Find slot mapping: Table 1 → Slot A
  ↓
Update match: { slotId: "A", broadcastSessionId: "..." }
  ↓
Create command: {
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  type: "obs_scene_switch",
  ...
}
  ↓
Tauri app (Slot A) processes command (filtered by venueId + sessionId + slotId)
  ↓
OBS switches to match scene
```

### Overlay Display Flow

```
OBS Browser Source: /overlay/slot/A
  ↓
OverlayTVPage receives slotId="A"
  ↓
Sequential fallback strategy:
  1. Query: where("slotId", "==", "A") + where("status", "==", "inProgress")
  2. If no result, fallback to table-based query (legacy)
  ↓
Display match overlay
```

### Command Processing Flow

```
Web App creates command
  ↓
Firestore: commands/{id} {
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  status: "pending"
}
  ↓
Tauri app (Slot A) listens via Firestore listener
  (filtered by venueId + broadcastSessionId + slotId)
  ↓
Command arrives → Process command
  ↓
Execute OBS WebSocket call
  ↓
Update command: {
  status: "completed",
  processedAt: now,
  processedBy: "agent-789"
}
  ↓
Send heartbeat: {
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  lastSeen: now,
  obsStatus: "connected"
}
```

## Key Design Decisions

1. **Dual-Write Pattern**: Write both `table` and `slotId` to matches
   - Preserves backward compatibility
   - Allows gradual migration
   - Admin UX unchanged

2. **Slot Resolution Service**: Centralized mapping logic
   - Single source of truth for slot↔table mapping
   - Easy to test and maintain
   - Can be enhanced with caching

3. **Optional Fields**: `slotId` and `broadcastSessionId` are optional
   - Existing matches continue to work
   - New matches get slots when session is active
   - No breaking changes

4. **URL Compatibility**: Keep `:table` routes, add `:slotId` routes
   - OBS browser sources can migrate gradually
   - Both routes work simultaneously
   - Admin can choose which to use

5. **Command Queue**: Firestore-based command system
   - Decoupled web app and Tauri app
   - Resilient to network issues
   - Can replay failed commands

6. **Heartbeat System**: Agent status monitoring
   - Know which slots are active
   - Detect disconnected agents
   - UI can show agent health

## Migration Strategy

### Phase 1: Add Infrastructure (No Breaking Changes)
- Add Firestore collections: `broadcastSessions`, `commands`, `agentHeartbeats`
- Add `slotId?` and `broadcastSessionId?` to Match type
- Create `SlotResolutionService` (not yet used)

### Phase 2: Admin Session Management
- Create broadcast session management UI
- Allow admins to create sessions and map slots
- Still use table-based assignment (slots assigned behind scenes)

### Phase 3: Overlay Slot Support
- Add slot-based overlay routes
- Update overlay pages to support both table and slot
- Keep table routes working

### Phase 4: Tauri App
- Build Tauri control app
- Implement OBS WebSocket integration
- Implement Firestore command listener

### Phase 5: Command Integration
- Web app creates commands when matches start
- Tauri app processes commands
- Full automation working

### Phase 6: Migration (Optional)
- Update OBS browser sources to use slot routes
- Deprecate table routes (or keep for compatibility)
