# Architecture Decisions

This document captures key architectural decisions for the multi-agent streaming system implementation.

## Firestore Schema Decisions

### Top-Level Collections Only

**Decision:** `commands` and `agentHeartbeats` are **top-level Firestore collections**, not subcollections.

**Rationale:**
- Simplifies querying across all commands/heartbeats
- Enables efficient filtering by venueId, broadcastSessionId, and slotId
- Avoids nested collection complexity
- Better performance for cross-session queries

**Structure:**
```
/commands/{commandId}
  - venueId: string
  - broadcastSessionId: string
  - slotId: string
  - type: CommandType
  - status: "pending" | "processing" | "completed" | "failed"
  - payload: Record<string, unknown>
  - createdAt: number
  - processedAt?: number
  - processedBy?: string
  - error?: string

/agentHeartbeats/{agentId}
  - venueId: string
  - broadcastSessionId: string
  - slotId: string
  - agentId: string
  - obsStatus: "connected" | "disconnected" | "error"
  - lastSeen: number
  - capabilities: string[]
  - metadata?: Record<string, unknown>
```

**Query Pattern:**
```typescript
// Query commands for a specific slot in a session
query(
  collection(db, "commands"),
  where("venueId", "==", venueId),
  where("broadcastSessionId", "==", sessionId),
  where("slotId", "==", slotId),
  where("status", "==", "pending")
)

// Query heartbeats for all slots in a session
query(
  collection(db, "agentHeartbeats"),
  where("venueId", "==", venueId),
  where("broadcastSessionId", "==", sessionId),
  where("lastSeen", ">", fiveMinutesAgo)
)
```

## Slot/Table Dual-Model Decision

**Decision:** Physical tables remain central in admin UX. Slots are a streaming abstraction layer.

**Rationale:**
- Admins think in terms of physical tables
- Slots are for OBS/streaming configuration only
- Maintains backward compatibility
- No UX disruption for existing workflows

**Implementation:**
- Admin pages continue to use `table: number` as primary identifier
- `slotId` is automatically resolved and added when active session exists
- Overlay routes support both `:table` and `:slotId` parameters
- Match documents store both `table` and `slotId` (dual-write pattern)

**Data Flow:**
```
Admin assigns match to Table 1
  ↓
Match document: { table: 1, status: "inProgress" }
  ↓ (if active session exists)
Slot resolution: Table 1 → Slot A
  ↓
Match document updated: { table: 1, slotId: "A", broadcastSessionId: "..." }
```

## Command Scoping Decision

**Decision:** Commands are scoped by `venueId + broadcastSessionId + slotId` combination.

**Rationale:**
- Prevents command conflicts across venues
- Ensures commands are processed by correct agent instance
- Supports multi-venue concurrent operations
- Clear ownership and isolation

**Query Strategy:**
- Tauri agents filter commands by their assigned `venueId`, `broadcastSessionId`, and `slotId`
- Web app creates commands with all three fields populated
- No cross-venue command leakage

**Example:**
```typescript
// Web app creates command
await createCommand({
  venueId: "venue-123",
  broadcastSessionId: "session-456",
  slotId: "A",
  type: "obs_scene_switch",
  payload: { sceneName: "Match Active" }
});

// Tauri agent (Slot A) listens
const commandsQuery = query(
  collection(db, "commands"),
  where("venueId", "==", myVenueId),
  where("broadcastSessionId", "==", mySessionId),
  where("slotId", "==", "A"),
  where("status", "==", "pending")
);
```

## Multi-Venue Concurrency Rule

**Decision:** Only **ONE active broadcast session per venue per date** is allowed.

**Rationale:**
- Prevents slot mapping conflicts
- Simplifies slot resolution logic
- Ensures consistent overlay behavior
- Clear ownership of physical tables

**Enforcement (D1 – activeSessions lock):**
- Use a **top-level lock collection** `activeSessions` with document ID `{venueId}_{dateKey}`.
- Session activation MUST be **transactional**: in one transaction, write the lock doc (`broadcastSessionId`, `updatedAt: serverTimestamp`) and set `broadcastSessions/{sessionId}.status = "active"`; optionally set previous session (from previous lock value) to `"completed"`.
- Do **not** use "query other actives then update" – the lock doc guarantees at most one active per venue/date under concurrency.

**Query Pattern (for reading active session):**
- Read `activeSessions/{venueId}_{dateKey}` to get `broadcastSessionId`; then read `broadcastSessions/{broadcastSessionId}` if needed. Alternatively keep querying `broadcastSessions` by venueId+date+status for read-only display, but activation must use the transaction above.

## SlotId Flexibility Decision

**Decision:** `slotId` is defined as `string` type, not hardcoded union type `"A" | "B" | "C" | "D"`.

**Rationale:**
- Allows future expansion beyond 4 slots
- Supports custom slot naming conventions
- More flexible for different venue configurations
- Session configuration defines valid slotIds

**Implementation:**
- TypeScript type: `slotId: string`
- Session `slotMappings` array defines which slotIds are valid for that session
- Examples/documentation use "A", "B", "C", "D" for clarity, but not enforced by type system
- Validation happens at runtime based on session configuration

**Example:**
```typescript
interface SlotMapping {
  slotId: string; // Not "A" | "B" | "C" | "D"
  physicalTable: number;
  isActive: boolean;
}

// Session can define any slotIds
const session: BroadcastSession = {
  slotMappings: [
    { slotId: "A", physicalTable: 1, isActive: true },
    { slotId: "B", physicalTable: 2, isActive: true },
    { slotId: "C", physicalTable: 3, isActive: true },
    { slotId: "D", physicalTable: 4, isActive: true },
    // Future: Could add "E", "F", or custom names
  ]
};
```

## Overlay Query Strategy

**Decision:** Overlay pages use **sequential fallback strategy**, not concurrent listeners.

**Rationale:**
- Prevents duplicate Firestore listeners
- Reduces Firestore read costs
- Clearer error handling
- Better performance

**Strategy:**
1. **First attempt:** Query by `slotId` if `slotId` parameter exists
2. **Fallback:** If no result, query by `table` parameter (legacy)
3. **Never run both queries in parallel**

**Implementation Pattern:**
```typescript
useEffect(() => {
  let unsubscribe: (() => void) | null = null;
  
  const loadMatch = async () => {
    if (slotId) {
      // Try slot-based query first
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
    
    // Fallback to table-based query
    if (tableParam) {
      const tableQuery = query(
        collection(db, "matches"),
        where("table", "==", parseInt(tableParam)),
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
}, [slotId, tableParam]);
```

**Key Points:**
- Only one Firestore listener active at a time
- Slot query takes precedence if both parameters exist
- Table query is fallback for backward compatibility
- No performance degradation from concurrent queries

## Red Team Hardening Decisions

### D1: activeSessions lock for session activation
- **Decision:** Use a top-level collection `activeSessions` with doc ID `{venueId}_{dateKey}`. Activate session in a **Firestore transaction**: write lock doc + set session status to active (and optionally deactivate previous session from previous lock value). Do not rely on query-then-update for activation.
- **Rationale:** Prevents race conditions when two admins activate different sessions for the same venue/date.

### D2: Command leasing and idempotence
- **Decision:** Commands include leasing fields: `processedBy`, `leaseUntil`, `attemptCount`, `lastError`, `completedAt` (serverTimestamp). "Claim command" is a **transaction**: allowed if status is pending OR (processing and leaseUntil &lt; now); then set status=processing, processedBy=agentId, leaseUntil=now+30s, increment attemptCount. Commands must be **idempotent** (set/absolute actions, never toggle).
- **Rationale:** Prevents duplicate consumption by multiple agents; expired leases allow retries.

### D3: Heartbeat cadence and offline threshold
- **Decision:** Heartbeat interval **10–15 seconds**. Offline threshold **60 seconds** (agent considered offline if lastSeen older than 60s). `lastSeen` MUST be serverTimestamp.
- **Rationale:** Balances freshness vs. write cost; serverTimestamp avoids client clock skew.

### D4: serverTimestamp for ordering
- **Decision:** All ordering/consistency timestamps use Firestore **serverTimestamp**: commands.createdAt, commands.completedAt; agentHeartbeats.lastSeen; activeSessions.updatedAt.
- **Rationale:** Consistent ordering and staleness checks across clients.

### D5: Security model (minimum viable)
- **Decision:** Firebase Auth + custom claims: `role` ("admin" | "operator"), `venueIds` (string[]). Admin can create/activate sessions and create commands. Operator (Tauri) can: read commands for allowed venues; update ONLY leasing/status fields on commands (not venueId, broadcastSessionId, slotId, type, payload); upsert only its own agentHeartbeats doc for allowed venues.
- **Rationale:** Least privilege; operators cannot change command intent.

## Summary

| Decision | Key Point |
|----------|-----------|
| **Firestore Structure** | Commands and agentHeartbeats are top-level collections with venueId, broadcastSessionId, slotId |
| **Slot/Table Model** | Physical tables central in UX, slots are streaming abstraction |
| **Command Scoping** | Scoped by venueId + broadcastSessionId + slotId |
| **Multi-Venue Concurrency** | Only ONE active session per venue per date; enforced via activeSessions lock (D1) |
| **SlotId Type** | String (not hardcoded union), validated by session config |
| **Overlay Queries** | Sequential fallback (slotId first, then table), no concurrent listeners |
| **D1** | activeSessions lock; transactional activation |
| **D2** | Command leasing (claim transaction) and idempotent processing |
| **D3** | Heartbeat 10–15s, offline 60s, lastSeen serverTimestamp |
| **D4** | All ordering timestamps use serverTimestamp |
| **D5** | Security: admin/operator, venueIds, operator limited updates |
