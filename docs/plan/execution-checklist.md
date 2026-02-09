# Execution Checklist

## Branch Strategy

**Main branches:**
- `main` - Production-ready code
- `develop` - Integration branch for features

**Feature branches:**
- `feature/slot-infrastructure` - Phase 1: Firestore schema + services
- `feature/broadcast-sessions` - Phase 2: Session management UI
- `feature/overlay-slots` - Phase 3: Slot-based overlay routes
- `feature/tauri-control-app` - Phase 4: Tauri desktop app
- `feature/command-integration` - Phase 5: Command system

**Naming convention:**
- `feature/{phase-name}`
- `fix/{issue-description}`
- `docs/{documentation-update}`

## Phase 1: Infrastructure Foundation

**Branch:** `feature/slot-infrastructure`

**Scope:** Minimal. Match extension, broadcast session types, slot resolution (given sessionId), broadcast session CRUD, and ONE Firestore index only. No Command/AgentHeartbeat types or indexes in this phase.

### Tasks

#### 1.1 Firestore Schema Extensions
- [ ] Add `slotId?: string` to `Match` type in `live-scoring/src/types.ts`
- [ ] Add `broadcastSessionId?: string` to Match type
- [ ] Create `BroadcastSession` interface type
- [ ] Create `SlotMapping` interface type (slotId as string, not hardcoded union)
- [ ] **Do NOT add in Phase 1:** Command interface, AgentHeartbeat interface (moved to Phase 5)

**Files:**
- `live-scoring/src/types.ts`
- `live-scoring/src/types/broadcast.ts` (NEW)

#### 1.2 Firestore Indexes
- [ ] Add **only one** index: `broadcastSessions` - `venueId` + `date` + `status` (ASC) - For active session lookup per venue/date
- [ ] **Do NOT add in Phase 1:** matches(slotId+status), matches(broadcastSessionId+status), commands indexes, agentHeartbeats indexes (see Phase 3, 4, 5)

**File:** `firestore.indexes.json`

#### 1.3 Slot Resolution Service
- [ ] Create `live-scoring/src/services/slotResolutionService.ts`
- [ ] Implement `resolveSlotToTable(slotId, sessionId)` - Returns physical table for slot (given sessionId)
- [ ] Implement `resolveTableToSlot(table, sessionId)` - Returns slotId for table (given sessionId)
- [ ] Implement `getSlotMappings(sessionId)` - Returns active slot mappings for session
- [ ] **Do NOT implement `getActiveSession`** - Active session lookup exists **only** in BroadcastSessionService (`getActiveSessionForVenueAndDate`)
- [ ] Add caching layer (optional, for performance)
- [ ] Write unit tests

**Dependencies:** Firestore client

#### 1.4 Broadcast Session Service
- [ ] Create `live-scoring/src/services/broadcastSessionService.ts`
- [ ] Implement `createSession(sessionData)`
- [ ] Implement `updateSession(sessionId, updates)`
- [ ] Implement `getSession(sessionId)`
- [ ] Implement `getActiveSessionForVenueAndDate(venueId, date)` - **Only place** that retrieves active session; query MUST filter by venueId + date + status
- [ ] Implement `activateSession(sessionId)` - **MUST deactivate any other active session for same venue/date**
- [ ] Implement `deactivateSession(sessionId)`
- [ ] Write unit tests
- [ ] **IMPORTANT:** Enforce multi-venue concurrency rule: Only ONE active session per venue per date

### Acceptance Criteria

- [ ] All new types compile without errors (Match + BroadcastSession + SlotMapping only; no Command/AgentHeartbeat in Phase 1)
- [ ] **Only one** Firestore index deployed: broadcastSessions (venueId + date + status)
- [ ] Slot resolution service can resolve slot↔table mappings **given sessionId** (no getActiveSession in SlotResolutionService)
- [ ] Broadcast session service can CRUD sessions and get active session by venue/date
- [ ] No breaking changes to existing Match queries
- [ ] Existing overlay routes still work

### Regression Risk: **LOW**
- Only adding optional fields
- No changes to existing queries
- New services not yet integrated

### Rollback Strategy
- Remove new type fields (optional, safe to leave)
- Remove new Firestore indexes (safe, not used yet)
- Delete new service files

### Testing Checklist
- [ ] TypeScript compilation succeeds
- [ ] Firestore rules allow new collections
- [ ] Can create test broadcast session
- [ ] Can create test slot mappings
- [ ] Slot resolution returns correct mappings

---

## Phase 2: Broadcast Session Management UI

**Branch:** `feature/broadcast-sessions`

### Tasks

#### 2.1 Broadcast Session List Page
- [ ] Create `live-scoring/src/pages/BroadcastSessionsListPage.tsx`
- [ ] Display list of sessions (table view)
- [ ] Show session status badges
- [ ] Add "Create Session" button
- [ ] Add edit/delete actions
- [ ] Add "Activate" button for scheduled sessions
- [ ] Add route: `/broadcast-sessions`

**File:** `live-scoring/src/pages/BroadcastSessionsListPage.tsx` (NEW)

#### 2.2 Broadcast Session Form Page
- [ ] Create `live-scoring/src/pages/BroadcastSessionFormPage.tsx`
- [ ] Form fields:
  - Venue name (text input)
  - Date (date picker)
  - Start time (time picker)
  - End time (optional, time picker)
- [ ] Slot mapping section:
  - Slot A → Table dropdown
  - Slot B → Table dropdown
  - Slot C → Table dropdown
  - Slot D → Table dropdown
- [ ] Load available tables from current encounter
- [ ] Validation: No duplicate table assignments
- [ ] Save/create session
- [ ] Add route: `/broadcast-sessions/new` and `/broadcast-sessions/:id/edit`

**File:** `live-scoring/src/pages/BroadcastSessionFormPage.tsx` (NEW)

#### 2.3 Integration with LiveScoringManagementPage
- [ ] Add "Broadcast Session" indicator/badge
- [ ] Show active session info if exists
- [ ] Show slot assignments (e.g., "Table 1 (Slot A)")
- [ ] Add link to session management
- [ ] Optional: Quick session creation from encounter page

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

#### 2.4 Navigation Updates
- [ ] Add "Broadcast Sessions" to admin menu/navigation
- [ ] Update AppRouter with new routes
- [ ] Add RequireAuth wrapper for session pages

**Files:**
- `live-scoring/src/pages/AppRouter.tsx`
- `live-scoring/src/App.tsx`

### Acceptance Criteria

- [ ] Can create broadcast session with venue/date
- [ ] Can map slots A/B/C/D to physical tables
- [ ] Can activate/deactivate sessions
- [ ] Active session visible in LiveScoringManagementPage
- [ ] Slot assignments shown in table UI (optional badge)
- [ ] No impact on existing match assignment flow

### Regression Risk: **LOW**
- New pages, no changes to existing functionality
- Optional UI enhancements only

### Rollback Strategy
- Remove new pages and routes
- Remove UI enhancements from LiveScoringManagementPage

### Testing Checklist
- [ ] Can create session via UI
- [ ] Can edit session
- [ ] Can activate session
- [ ] Slot mappings saved correctly
- [ ] Active session appears in admin page
- [ ] Existing match assignment still works

---

## Phase 3: Slot-Based Overlay Support

**Branch:** `feature/overlay-slots`

### Tasks

#### 3.1 Slot Resolution in Overlays
- [ ] Update `OverlayTVPage` to support slot-based resolution
- [ ] Add route parameter: `/overlay/tv/:table` (keep) + `/overlay/tv/slot/:slotId` (new)
- [ ] Implement **sequential fallback strategy** (NOT concurrent listeners):
  - **First attempt:** If `slotId` param exists, query by `slotId` + `status`
  - **Fallback:** If no result from slotId query, query by `table` param (legacy)
  - **Never run both queries in parallel**
- [ ] Update `LiveOverlayPage` similarly
- [ ] Update all overlay page variants (Classic, Modern, etc.)
- [ ] **IMPORTANT:** Only ONE Firestore listener active at a time per overlay page

**Files:**
- `live-scoring/src/pages/OverlayTVPage.tsx`
- `live-scoring/src/pages/LiveOverlayPage.tsx`
- `live-scoring/src/pages/OverlayClassicPage.tsx`
- `live-scoring/src/pages/OverlayModernPage.tsx`
- `live-scoring/src/pages/OverlayMinimalPage.tsx`
- `live-scoring/src/pages/OverlaySportPage.tsx`
- `live-scoring/src/pages/OverlayElegantPage.tsx`
- `live-scoring/src/pages/OverlayHorizontalPage.tsx`
- `live-scoring/src/pages/OverlayDesignsPage.tsx`

#### 3.2 Match Assignment with Slot
- [ ] Update `startMatch()` in `LiveScoringManagementPage`
- [ ] After assigning table, resolve slot and update match
- [ ] Add `slotId` and `broadcastSessionId` to match document
- [ ] Handle case where no active session exists (skip slot assignment)

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Code location:** Lines 489-501 (`startMatch` function)

#### 3.3 Query Optimization and Indexes
- [ ] Update overlay queries to use sequential fallback (slotId first, then table)
- [ ] **Do NOT use concurrent listeners** - use sequential getDocs() then onSnapshot()
- [ ] Add composite query: `where("slotId", "==", slotId) + where("status", "==", "inProgress")`
- [ ] Add Firestore index: `matches` - `slotId` + `status` (ASC) - Required for overlay slot-based queries in this phase
- [ ] **Performance:** Only one listener per overlay page to reduce Firestore reads

**Files:**
- All overlay page components
- `live-scoring/src/services/slotResolutionService.ts`
- `firestore.indexes.json`

#### 3.4 Route Updates
- [ ] Add slot-based routes to AppRouter
- [ ] Keep table-based routes (backward compatibility)
- [ ] Update route documentation

**File:** `live-scoring/src/pages/AppRouter.tsx` or `live-scoring/src/App.tsx`

### Acceptance Criteria

- [ ] Overlay routes work with both `:table` and `:slotId` parameters
- [ ] Slot-based overlays display correct match
- [ ] Table-based overlays still work (backward compatibility)
- [ ] Match assignment adds `slotId` when session active
- [ ] Queries use indexes efficiently
- [ ] No performance degradation

### Regression Risk: **MEDIUM**
- Changes to overlay query logic
- Changes to match assignment
- Risk: Overlays may not display matches if slot resolution fails

### Rollback Strategy
- Revert overlay query changes
- Revert match assignment changes
- Keep slot resolution service (not breaking)

### Testing Checklist
- [ ] Overlay with `:table` param still works
- [ ] Overlay with `:slotId` param displays match
- [ ] Match assignment adds slotId correctly
- [ ] Overlay works when no active session (falls back to table)
- [ ] Multiple overlays can run simultaneously
- [ ] Performance: Query response time < 500ms

---

## Phase 4: Tauri Control App

**Branch:** `feature/tauri-control-app`

### Tasks

#### 4.1 Tauri Project Setup
- [ ] Initialize Tauri project: `tauri-control-app/`
- [ ] Configure `tauri.conf.json`:
  - App name: "SQY Ping Control"
  - Bundle identifier
  - Permissions: network, filesystem
- [ ] Set up Rust workspace structure
- [ ] Configure build targets (Windows, macOS only)

**Directory:** `tauri-control-app/` (NEW)

#### 4.2 OBS WebSocket Client
- [ ] Add `obs-websocket-rs` dependency to `Cargo.toml`
- [ ] Create `src/services/obs_client.rs`
- [ ] Implement connection management
- [ ] Implement scene switching
- [ ] Implement source visibility control
- [ ] Implement stream start/stop
- [ ] Add error handling and reconnection logic
- [ ] Write unit tests

**File:** `tauri-control-app/src/services/obs_client.rs` (NEW)

#### 4.3 Tauri Commands (Rust)
- [ ] Create `src/commands/obs.rs`
- [ ] Implement `obs_connect` command
- [ ] Implement `obs_disconnect` command
- [ ] Implement `obs_switch_scene` command
- [ ] Implement `obs_set_source_visibility` command
- [ ] Implement `obs_start_stream` command
- [ ] Implement `obs_stop_stream` command
- [ ] Implement `obs_get_status` command
- [ ] Register commands in `main.rs`

**Files:**
- `tauri-control-app/src/commands/obs.rs` (NEW)
- `tauri-control-app/src/main.rs`

#### 4.4 Firestore Integration (React/TypeScript – Firebase JS SDK)
- [ ] Add Firebase JS SDK to Tauri UI (`ui/package.json`), **not** Firestore in Rust
- [ ] Create `ui/src/services/firestoreClient.ts` - Initialize Firebase app and Firestore instance
- [ ] Implement command listener in React (e.g. `useCommandQueue`) - **MUST filter by venueId + broadcastSessionId + slotId**
- [ ] Implement command status updates from React
- [ ] Implement heartbeat updates from React (e.g. `useHeartbeat`) - **MUST include venueId, broadcastSessionId, slotId**
- [ ] **IMPORTANT:** Commands and heartbeats are top-level collections, not subcollections

**Files:** `tauri-control-app/ui/src/services/firestoreClient.ts` (NEW), `tauri-control-app/ui/src/hooks/useCommandQueue.ts`, `tauri-control-app/ui/src/hooks/useHeartbeat.ts`

#### 4.5 Firestore Indexes for agentHeartbeats (Phase 4)
- [ ] Add index: `agentHeartbeats` - `venueId` + `broadcastSessionId` + `slotId` + `lastSeen` (DESC)
- [ ] Add index: `agentHeartbeats` - `venueId` + `broadcastSessionId` + `slotId` (ASC)
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

**File:** `firestore.indexes.json`

#### 4.6 Command Processor (React/TypeScript)
- [ ] Extend `useCommandQueue` (or equivalent) with command routing by type
- [ ] Invoke Rust Tauri commands for OBS actions (scene switch, source visibility, stream start/stop)
- [ ] Implement retry logic for failed commands
- [ ] Update command status in Firestore from React
- [ ] Add logging

**File:** `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (extend)

#### 4.7 Tauri UI (React)
- [ ] Set up React + TypeScript in `ui/` directory
- [ ] Create `ui/src/components/SlotControl.tsx`
- [ ] Create `ui/src/components/OBSStatus.tsx`
- [ ] Create `ui/src/components/CommandQueue.tsx`
- [ ] Create `ui/src/pages/Dashboard.tsx`
- [ ] Create `ui/src/pages/Settings.tsx`
- [ ] Create `ui/src/hooks/useOBS.ts`
- [ ] Create `ui/src/hooks/useCommandQueue.ts`
- [ ] Style with Material-UI or similar

**Directory:** `tauri-control-app/ui/` (NEW)

#### 4.8 State Management
- [ ] Create `src/state.rs` for shared app state (OBS connection, slot config); command queue state in React
- [ ] Manage OBS connection state in Rust
- [ ] Manage slot configuration
- [ ] Command queue state in React (useCommandQueue)

**File:** `tauri-control-app/src/state.rs` (NEW)

#### 4.9 Build & Packaging
- [ ] Configure Windows build (`.exe` + `.zip`)
- [ ] Configure macOS build (`.dmg` + `.app`)
- [ ] Set up GitHub Actions for CI/CD (Windows + macOS runners only)
- [ ] Test builds on Windows and macOS

**Files:**
- `tauri-control-app/.github/workflows/build.yml` (NEW)
- `tauri-control-app/tauri.conf.json`

### Acceptance Criteria

- [ ] Tauri app builds successfully (Windows + macOS)
- [ ] Can connect to OBS WebSocket
- [ ] Can switch scenes via UI
- [ ] Can control source visibility
- [ ] Can start/stop streaming
- [ ] Commands are received from Firestore
- [ ] Command status updates correctly
- [ ] Heartbeat updates every 5 seconds
- [ ] UI shows OBS connection status
- [ ] UI shows command queue

### Regression Risk: **NONE**
- Completely new application
- No impact on web app

### Rollback Strategy
- Remove `tauri-control-app/` directory
- No impact on web app

### Testing Checklist
- [ ] App launches without errors
- [ ] Can connect to OBS instance
- [ ] Scene switching works
- [ ] Source visibility toggles work
- [ ] Stream start/stop works
- [ ] Firestore connection established
- [ ] Commands received and processed
- [ ] Heartbeat updates visible in Firestore

---

## Phase 5: Command Integration

**Branch:** `feature/command-integration`

### Tasks

#### 5.1 Command and AgentHeartbeat Types (moved from Phase 1)
- [ ] Add `Command` interface to `live-scoring/src/types/broadcast.ts` (top-level collection: venueId, broadcastSessionId, slotId, type, payload, status, createdAt, etc.)
- [ ] Add `AgentHeartbeat` interface to `live-scoring/src/types/broadcast.ts` (top-level collection: venueId, broadcastSessionId, slotId, agentId, obsStatus, lastSeen, capabilities, etc.)
- [ ] Add `CommandType` union type if not already present

**File:** `live-scoring/src/types/broadcast.ts`

#### 5.2 Command Service (Web App)
- [ ] Create `live-scoring/src/services/commandService.ts`
- [ ] Implement `createCommand(commandData)` - **MUST include venueId, broadcastSessionId, slotId**
- [ ] Implement `getCommandsBySlot(venueId, sessionId, slotId)` - Query top-level collection with all three fields
- [ ] Implement `updateCommandStatus(commandId, status)`
- [ ] Add command types enum
- [ ] **IMPORTANT:** Commands are top-level collection, scoped by venueId + broadcastSessionId + slotId

**File:** `live-scoring/src/services/commandService.ts` (NEW)

#### 5.3 Firestore Indexes for commands (Phase 5)
- [ ] Add index: `commands` - `venueId` + `broadcastSessionId` + `slotId` + `status` + `createdAt` (ASC)
- [ ] Add index: `commands` - `venueId` + `broadcastSessionId` + `slotId` + `status` (ASC)
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

**File:** `firestore.indexes.json`

#### 5.4 Match Start Command Creation
- [ ] Update `startMatch()` in `LiveScoringManagementPage`
- [ ] After assigning slot, create OBS commands with **all required fields**:
  - `venueId` - From active session
  - `broadcastSessionId` - From active session
  - `slotId` - Resolved from table
  - `type` - Command type (obs_scene_switch, obs_source_visibility, etc.)
  - `payload` - Command-specific data
- [ ] Create commands:
  - `obs_scene_switch` - Switch to match scene
  - `obs_source_visibility` - Show overlay browser source
  - `obs_stream_start` - Start streaming (optional, configurable)
- [ ] Handle command creation errors gracefully

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Code location:** Lines 489-501 (`startMatch` function)

#### 5.5 Match Stop Command Creation
- [ ] Update match finish logic in `MatchScoreCard`
- [ ] When match finishes, create commands:
  - `obs_scene_switch` - Switch to idle/next match scene
  - `obs_stream_stop` - Stop streaming (optional)
- [ ] Or create stop command in `stopMatch()` function

**Files:**
- `live-scoring/src/components/MatchScoreCard.tsx`
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` (stopMatch function)

#### 5.6 Command Status UI (Optional)
- [ ] Add command status indicator in LiveScoringManagementPage
- [ ] Show pending/processing/completed commands per slot
- [ ] Show agent heartbeat status
- [ ] Add retry button for failed commands

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

#### 5.7 Agent Status Monitoring
- [ ] Create `live-scoring/src/hooks/useAgentStatus.ts`
- [ ] Monitor agent heartbeats per slot
- [ ] Display agent status in UI
- [ ] Show warnings for stale agents

**File:** `live-scoring/src/hooks/useAgentStatus.ts` (NEW)

### Acceptance Criteria

- [ ] Commands created when match starts
- [ ] Commands processed by Tauri app
- [ ] Command status updates correctly
- [ ] OBS scenes switch automatically
- [ ] Overlay sources show/hide automatically
- [ ] Agent status visible in admin UI
- [ ] Failed commands can be retried
- [ ] No impact if Tauri app not running (commands queue)

### Regression Risk: **LOW**
- Additive changes only
- Commands are fire-and-forget
- Existing match flow unchanged

### Rollback Strategy
- Remove command creation calls
- Keep command service (not breaking)
- Remove agent status UI

### Testing Checklist
- [ ] Command created when match starts
- [ ] Tauri app receives command
- [ ] OBS scene switches correctly
- [ ] Command status updates to "completed"
- [ ] Agent heartbeat visible in Firestore
- [ ] UI shows agent status
- [ ] Failed commands show error status
- [ ] Retry works for failed commands

---

## Phase 6: OBS Portable Packaging

**Branch:** `feature/obs-packaging`

### Tasks

#### 6.1 OBS Configuration Templates
- [ ] Create OBS config templates per slot
- [ ] Configure WebSocket ports: 4455 (A), 4456 (B), 4457 (C), 4458 (D)
- [ ] Set up browser sources pointing to slot overlay URLs
- [ ] Create scene templates: "Match Active", "Idle", "Next Match"
- [ ] Document configuration steps

**Directory:** `obs-portable-configs/` (NEW)

#### 6.2 Windows Packaging
- [ ] Download OBS Studio portable for Windows
- [ ] Create batch scripts: `start-obs-slot-a.bat`, etc.
- [ ] Configure scripts to use slot-specific config directories
- [ ] Create `obs-portable-windows.zip`
- [ ] Test on Windows machine

**Directory:** `obs-portable-configs/windows/` (NEW)

#### 6.3 macOS Packaging
- [ ] Download OBS Studio for macOS
- [ ] Create shell scripts: `start-obs-slot-a.sh`, etc.
- [ ] Configure scripts to use slot-specific config directories
- [ ] Create `obs-portable-macos.tar.gz`
- [ ] Test on macOS machine

**Directory:** `obs-portable-configs/macos/` (NEW)

#### 6.4 Linux Packaging
- [ ] Download OBS Studio AppImage or compile
- [ ] Create shell scripts: `start-obs-slot-a.sh`, etc.
- [ ] Configure scripts to use slot-specific config directories
- [ ] Create `obs-portable-linux.tar.gz`
- [ ] Test on Linux machine

**Directory:** `obs-portable-configs/linux/` (NEW)

#### 6.5 Documentation
- [ ] Create `docs/obs-setup.md`
- [ ] Document installation steps per OS
- [ ] Document configuration per slot
- [ ] Document browser source setup
- [ ] Document troubleshooting

**File:** `docs/obs-setup.md` (NEW)

### Acceptance Criteria

- [ ] OBS portable packages available for all OS
- [ ] Can start 4 OBS instances simultaneously
- [ ] Each instance uses correct WebSocket port
- [ ] Browser sources point to correct overlay URLs
- [ ] Scenes configured correctly
- [ ] Documentation complete

### Regression Risk: **NONE**
- Separate packaging, no code changes

### Rollback Strategy
- Remove packaging directories
- No impact on codebase

### Testing Checklist
- [ ] Windows package extracts and runs
- [ ] macOS package extracts and runs
- [ ] Linux package extracts and runs
- [ ] All 4 slots can run simultaneously
- [ ] WebSocket ports don't conflict
- [ ] Browser sources load overlays correctly

---

## Cross-Phase Considerations

### Firestore Rules Updates

**File:** `firestore.rules`

**Current:** Open read/write (development mode)

**Target:** Secure rules for production

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Matches: authenticated users can read, admins can write
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Broadcast sessions: authenticated users can read, admins can write
    match /broadcastSessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Commands: agents can read/write their own slot, admins can read all
    match /commands/{commandId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       (resource.data.slotId == request.resource.data.slotId ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Agent heartbeats: agents can write their own, admins can read all
    match /agentHeartbeats/{agentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      (request.resource.data.agentId == request.auth.uid ||
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

**Tasks:**
- [ ] Design secure rules
- [ ] Test rules in Firestore emulator
- [ ] Deploy rules (after Phase 1)

### Error Handling Strategy

**Principles:**
- Graceful degradation: If slot resolution fails, fall back to table
- Command failures don't block match assignment
- Agent disconnections don't break overlays
- Log all errors for debugging

**Implementation:**
- [ ] Add error boundaries in React components
- [ ] Add try-catch blocks in service functions
- [ ] Add error logging service
- [ ] Add user-friendly error messages

### Performance Considerations

**Optimizations:**
- [ ] Cache slot mappings (5-minute TTL)
- [ ] Batch command creation
- [ ] Use Firestore listeners instead of polling
- [ ] Optimize overlay queries with proper indexes
- [ ] Lazy load overlay components

**Monitoring:**
- [ ] Add performance metrics
- [ ] Monitor Firestore query performance
- [ ] Monitor command processing latency
- [ ] Set up alerts for slow queries

### Documentation Updates

**Files to update:**
- [ ] `README.md` - Add slot system overview
- [ ] `docs/ARCHITECTURE.md` - Document slot architecture
- [ ] `docs/DEPLOYMENT.md` - Add Tauri app deployment
- [ ] `docs/API.md` - Document command API
- [ ] `docs/TROUBLESHOOTING.md` - Add slot-related issues

## Testing Strategy

### Unit Tests
- [ ] Slot resolution service tests
- [ ] Broadcast session service tests
- [ ] Command service tests
- [ ] OBS client tests (Rust)
- [ ] Command processor tests (Rust)

### Integration Tests
- [ ] Match assignment with slot resolution
- [ ] Overlay display with slot resolution
- [ ] Command creation and processing flow
- [ ] Agent heartbeat updates

### E2E Tests
- [ ] Create broadcast session → Assign match → Overlay displays
- [ ] Command created → Tauri processes → OBS switches scene
- [ ] Multiple slots active simultaneously
- [ ] Agent disconnection recovery

### Manual Testing Checklist
- [ ] Test on Windows machine
- [ ] Test on macOS machine
- [ ] Test on Linux machine
- [ ] Test with 4 OBS instances running
- [ ] Test overlay display in OBS browser sources
- [ ] Test command processing latency
- [ ] Test error scenarios (no session, agent offline, etc.)

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Firestore indexes deployed
- [ ] Firestore rules updated
- [ ] Environment variables configured

### Deployment Steps
1. [ ] Merge feature branch to `develop`
2. [ ] Run integration tests on `develop`
3. [ ] Merge `develop` to `main`
4. [ ] Deploy web app to Firebase Hosting
5. [ ] Deploy Firestore indexes
6. [ ] Deploy Firestore rules
7. [ ] Create GitHub release for Tauri app
8. [ ] Update OBS portable packages (if changed)

### Post-Deployment
- [ ] Verify web app accessible
- [ ] Verify Firestore collections accessible
- [ ] Verify overlays load correctly
- [ ] Verify Tauri app can connect
- [ ] Monitor error logs
- [ ] Monitor performance metrics

## Rollback Procedures

### Phase 1 Rollback
- Remove new type fields (optional, safe to leave)
- Remove Firestore indexes (safe if not used)
- Delete service files

### Phase 2 Rollback
- Remove broadcast session pages
- Remove routes
- Remove UI enhancements

### Phase 3 Rollback
- Revert overlay query changes
- Revert match assignment changes
- Keep slot resolution service (not breaking)

### Phase 4 Rollback
- Remove Tauri app directory
- No impact on web app

### Phase 5 Rollback
- Remove command creation calls
- Keep command service (not breaking)
- Remove agent status UI

### Phase 6 Rollback
- Remove packaging directories
- No impact on codebase

## Success Metrics

### Phase 1
- Zero breaking changes
- All types compile
- Services can resolve slots

### Phase 2
- Admins can create sessions
- Sessions visible in admin UI
- No impact on match assignment

### Phase 3
- Overlays work with slots
- Overlays still work with tables
- Match assignment adds slots

### Phase 4
- Tauri app builds on all platforms
- Can control OBS
- Commands processed

### Phase 5
- Commands created automatically
- OBS switches scenes automatically
- Agent status visible

### Phase 6
- OBS packages available
- Can run 4 instances
- Documentation complete

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 1 week
- **Phase 3**: 1-2 weeks
- **Phase 4**: 3-4 weeks
- **Phase 5**: 1-2 weeks
- **Phase 6**: 1 week

**Total**: 8-11 weeks

## Dependencies

### External Dependencies
- Firebase/Firestore (already in use)
- OBS Studio (external software)
- OBS WebSocket plugin (external)
- Tauri framework (new)
- Rust toolchain (new)

### Internal Dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1
- Phase 4 can start in parallel
- Phase 5 depends on Phase 3 and Phase 4
- Phase 6 can start in parallel

## Risk Mitigation

### High Risk Areas
1. **Overlay query changes** - Mitigation: Keep table queries as fallback
2. **Match assignment changes** - Mitigation: Additive only, preserve existing flow
3. **Firestore query performance** - Mitigation: Add proper indexes, cache mappings
4. **Tauri app complexity** - Mitigation: Start simple, iterate

### Medium Risk Areas
1. **Command processing failures** - Mitigation: Retry logic, error handling
2. **Agent disconnections** - Mitigation: Heartbeat monitoring, graceful degradation
3. **Multi-venue conflicts** - Mitigation: Session scoping, date filtering

### Low Risk Areas
1. **UI changes** - Easy to revert
2. **Documentation** - No code impact
3. **Packaging** - Separate from codebase
