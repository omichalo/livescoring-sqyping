# Issues Backlog

## Milestone: feature/slot-infrastructure

### Issue #1: Add slotId and broadcastSessionId fields to Match type

**Goal:** Extend Match type with optional slot-related fields for backward compatibility.

**Files to touch:**
- `live-scoring/src/types.ts` - Add `slotId?: string` and `broadcastSessionId?: string` to Match interface

**Acceptance criteria:**
- [ ] Match type includes optional `slotId?: string` field
- [ ] Match type includes optional `broadcastSessionId?: string` field
- [ ] Existing Match type fields unchanged
- [ ] TypeScript compilation succeeds
- [ ] No breaking changes to existing code using Match type

**Manual test steps:**
1. Open `live-scoring/src/types.ts`
2. Verify Match interface has new optional fields
3. Run `npm run build` in `live-scoring/` directory
4. Verify no TypeScript errors
5. Check that existing code using Match type still compiles

**Risk:** LOW - Optional fields, no breaking changes

**Rollback:** Remove the two optional fields from Match interface

---

### Issue #2: Create BroadcastSession and related type definitions (Phase 1 scope only)

**Goal:** Define TypeScript types and interfaces for broadcast sessions and slot mappings only. Do **not** add Command or AgentHeartbeat in this milestone (they are introduced in PR #4 / PR #5).

**Files to touch:**
- `live-scoring/src/types/broadcast.ts` (NEW) - Create new file with broadcast/slot types only

**Acceptance criteria:**
- [ ] `SlotId` type defined as `string` (not hardcoded union)
- [ ] `SlotMapping` interface defined with `slotId: SlotId`, `physicalTable`, `isActive`, and optional fields
- [ ] `BroadcastSession` interface defined with all required fields (id, venueId, venueName, date, startTime, status, slotMappings, createdAt, updatedAt, etc.)
- [ ] **Do NOT add in Phase 1:** Command, AgentHeartbeat, or CommandType (see feature/tauri-control-app and feature/command-integration milestones)
- [ ] Only SlotId, SlotMapping, and BroadcastSession exported from the file
- [ ] TypeScript compilation succeeds

**Manual test steps:**
1. Create `live-scoring/src/types/broadcast.ts`
2. Define only SlotId, SlotMapping, and BroadcastSession
3. Export only those types
4. Import and use in SlotResolutionService / BroadcastSessionService
5. Verify TypeScript compilation succeeds

**Risk:** LOW - New file, no impact on existing code

**Rollback:** Delete `live-scoring/src/types/broadcast.ts`

---

### Issue #3: Add Firestore index for broadcast sessions

**Goal:** Add composite index to support efficient queries for active broadcast sessions per venue/date.

**Files to touch:**
- `firestore.indexes.json` - Add index definition

**Acceptance criteria:**
- [ ] Index added: `broadcastSessions` collection - `venueId` + `date` + `status` (ASC) - For active session lookup per venue/date
- [ ] Index deploys successfully via `firebase deploy --only firestore:indexes`
- [ ] Index supports `getActiveSessionForVenueAndDate` query in BroadcastSessionService

**Note:** 
- `matches` indexes for `slotId` and `broadcastSessionId` are deferred to PR #3 (overlay-slots milestone) where they are actually queried.
- `commands` indexes are deferred to PR #5 (command-integration milestone) where commands are created and queried.
- `agentHeartbeats` indexes are deferred to PR #4 (tauri-control-app milestone) where heartbeats are written and queried.

**Manual test steps:**
1. Edit `firestore.indexes.json`
2. Add the broadcastSessions index definition
3. Run `firebase deploy --only firestore:indexes`
4. Verify deployment succeeds
5. Check Firebase Console to confirm index is created
6. Test query: `where("venueId", "==", venueId) + where("date", "==", date) + where("status", "==", "active")`

**Risk:** LOW - Adding index, no code changes

**Rollback:** Remove index definition from `firestore.indexes.json` and redeploy

---

### Issue #4: Implement SlotResolutionService

**Goal:** Create service to resolve slot↔table mappings using active broadcast sessions.

**Files to touch:**
- `live-scoring/src/services/slotResolutionService.ts` (NEW) - Create service file

**Acceptance criteria:**
- [ ] `resolveSlotToTable(slotId, sessionId)` - Returns physical table number for a slot
- [ ] `resolveTableToSlot(table, sessionId)` - Returns slotId (string) for a physical table
- [ ] `getSlotMappings(sessionId)` - Returns all slot mappings for a session
- [ ] **IMPORTANT:** NO `getActiveSession` function - use `BroadcastSessionService.getActiveSessionForVenueAndDate()` instead
- [ ] All functions handle errors gracefully (return null on error)
- [ ] Functions use Firestore queries with proper error handling
- [ ] Optional: Add caching layer with 5-minute TTL

**Manual test steps:**
1. Create `live-scoring/src/services/slotResolutionService.ts`
2. Implement all three functions (resolveSlotToTable, resolveTableToSlot, getSlotMappings)
3. Create a test broadcast session in Firestore with venueId
4. Call `resolveTableToSlot(1, sessionId)` with a valid sessionId
5. Verify it returns correct slotId (string type)
6. Call `resolveSlotToTable("A", sessionId)` 
7. Verify it returns correct physical table number
8. Call `getSlotMappings(sessionId)`
9. Verify it returns all active slot mappings
10. Test error cases (invalid sessionId, no mappings)

**Risk:** LOW - New service, not yet integrated

**Rollback:** Delete `live-scoring/src/services/slotResolutionService.ts`

---

### Issue #5: Implement BroadcastSessionService

**Goal:** Create service for CRUD operations on broadcast sessions.

**Files to touch:**
- `live-scoring/src/services/broadcastSessionService.ts` (NEW) - Create service file

**Acceptance criteria:**
- [ ] `createSession(sessionData)` - Creates new broadcast session
- [ ] `updateSession(sessionId, updates)` - Updates existing session
- [ ] `getSession(sessionId)` - Retrieves session by ID
- [ ] `getActiveSessionForVenueAndDate(venueId, date)` - Gets active session for venue/date
- [ ] `activateSession(sessionId)` - Sets session status to "active"
  - **MUST deactivate any other active session for the same venue/date**
  - Enforces multi-venue concurrency rule: Only ONE active session per venue/date
- [ ] `deactivateSession(sessionId)` - Sets session status to "completed" or "scheduled"
- [ ] All functions use Firestore with proper error handling
- [ ] Functions validate input data

**Manual test steps:**
1. Create `live-scoring/src/services/broadcastSessionService.ts`
2. Implement all six functions
3. Create a test session via `createSession()` with venueId
4. Verify session appears in Firestore
5. Update session via `updateSession()`
6. Activate session via `activateSession()`
7. Create another session for same venue/date
8. Activate second session - verify first session is automatically deactivated
9. Retrieve active session via `getActiveSessionForVenueAndDate(venueId, date)`
10. Verify it returns only the activated session

**Risk:** LOW - New service, not yet integrated

**Rollback:** Delete `live-scoring/src/services/broadcastSessionService.ts`

---

## Milestone: feature/broadcast-sessions

### Issue #6: Create BroadcastSessionsListPage component

**Goal:** Build admin page to list and manage broadcast sessions.

**Files to touch:**
- `live-scoring/src/pages/BroadcastSessionsListPage.tsx` (NEW) - Create list page component

**Acceptance criteria:**
- [ ] Page displays list of all broadcast sessions in a table
- [ ] Shows columns: Venue, Date, Status, Actions
- [ ] Status badges: "Scheduled" (gray), "Active" (green), "Completed" (blue)
- [ ] "Create Session" button navigates to form page
- [ ] Edit button navigates to edit page
- [ ] Delete button with confirmation dialog
- [ ] "Activate" button for scheduled sessions (only shows when status is "scheduled")
- [ ] Uses `broadcastSessionService` to fetch sessions
- [ ] Real-time updates via Firestore listener
- [ ] Loading and error states handled

**Manual test steps:**
1. Create `live-scoring/src/pages/BroadcastSessionsListPage.tsx`
2. Implement table view with Material-UI Table component
3. Add Firestore listener for sessions collection
4. Test creating a session via button
5. Test editing a session
6. Test deleting a session (with confirmation)
7. Test activating a scheduled session
8. Verify real-time updates when session changes

**Risk:** LOW - New page, no impact on existing pages

**Rollback:** Delete `live-scoring/src/pages/BroadcastSessionsListPage.tsx` and remove route

---

### Issue #7: Create BroadcastSessionFormPage component

**Goal:** Build form page to create and edit broadcast sessions with slot mappings.

**Files to touch:**
- `live-scoring/src/pages/BroadcastSessionFormPage.tsx` (NEW) - Create form page component

**Acceptance criteria:**
- [ ] Form fields:
  - Venue name (TextField, required)
  - Date (DatePicker, required, default: today)
  - Start time (TimePicker, required)
  - End time (TimePicker, optional)
- [ ] Slot mapping section with 4 dropdowns:
  - Slot A → Table dropdown (populated from current encounter's numberOfTables)
  - Slot B → Table dropdown
  - Slot C → Table dropdown
  - Slot D → Table dropdown
- [ ] Validation: No duplicate table assignments (show error if same table selected twice)
- [ ] Load available tables from `useCurrentEncounter()` hook
- [ ] Save button creates/updates session via `broadcastSessionService`
- [ ] Cancel button navigates back to list
- [ ] Success message after save
- [ ] Error handling with user-friendly messages
- [ ] Edit mode: Pre-fill form with existing session data

**Manual test steps:**
1. Create `live-scoring/src/pages/BroadcastSessionFormPage.tsx`
2. Implement form with all fields
3. Test creating a new session
4. Verify slot mappings save correctly
5. Test validation (duplicate tables)
6. Test editing an existing session
7. Verify form pre-fills with session data
8. Test cancel button
9. Test save with missing required fields

**Risk:** LOW - New page, no impact on existing pages

**Rollback:** Delete `live-scoring/src/pages/BroadcastSessionFormPage.tsx` and remove routes

---

### Issue #8: Add broadcast session routes to AppRouter

**Goal:** Add routes for broadcast session pages and protect with RequireAuth.

**Files to touch:**
- `live-scoring/src/pages/AppRouter.tsx` - Add new routes
- `live-scoring/src/App.tsx` - Add new routes (if AppRouter not used)

**Acceptance criteria:**
- [ ] Route `/broadcast-sessions` → `BroadcastSessionsListPage` (with RequireAuth)
- [ ] Route `/broadcast-sessions/new` → `BroadcastSessionFormPage` (with RequireAuth)
- [ ] Route `/broadcast-sessions/:id/edit` → `BroadcastSessionFormPage` (with RequireAuth)
- [ ] Routes are protected by RequireAuth wrapper
- [ ] Navigation works correctly

**Manual test steps:**
1. Add routes to AppRouter.tsx or App.tsx
2. Test navigating to `/broadcast-sessions`
3. Verify RequireAuth redirects if not authenticated
4. Test navigating to `/broadcast-sessions/new`
5. Test navigating to `/broadcast-sessions/{id}/edit` with valid session ID
6. Verify 404 for invalid session ID

**Risk:** LOW - New routes only

**Rollback:** Remove route definitions from AppRouter.tsx or App.tsx

---

### Issue #9: Implement activeSessions lock and transactional activateSession

**Goal:** Enforce "one active session per venue per date" using a top-level lock collection and a Firestore transaction. Replace any "query other actives then update" with transactional activation.

**Files to touch:**
- `live-scoring/src/services/broadcastSessionService.ts` - Add activeSessions usage and transaction
- (Optional) Resolve active session via `activeSessions/{venueId}_{dateKey}` for consistency

**Acceptance criteria:**
- [ ] Top-level collection **activeSessions** used; document ID `{venueId}_{dateKey}` (dateKey = YYYY-MM-DD); fields: venueId, dateKey, broadcastSessionId, updatedAt (serverTimestamp)
- [ ] `activateSession(sessionId)` runs in a **Firestore transaction**: write lock doc (broadcastSessionId, updatedAt), set broadcastSessions/{sessionId}.status = "active"; optionally set previous session (from previous lock) to "completed"
- [ ] Two concurrent activations for the same venue/date cannot both succeed (transaction enforces single writer)
- [ ] No placeholder venueId; use venue from session document

**Manual test steps (concurrency):**
1. Open two browser tabs on broadcast sessions list
2. Create two sessions for same venue/date; try activating both at once
3. Verify only one ends up active and lock doc has single broadcastSessionId
4. **Manual test: wrong venue selection** – verify session/overlay use selected venue (banner/confirmation if mismatch)

**Risk:** LOW - Transactional behavior, no UX change except robustness

**Rollback:** Revert activateSession to non-transactional (not recommended for production)

---

### Issue #10: Create useVenueSelection hook

**Goal:** Create a React hook to manage user-selected venueId with localStorage persistence and cross-tab synchronization.

**Files to touch:**
- `live-scoring/src/hooks/useVenueSelection.ts` (NEW) - Venue selection hook
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Add venue selector UI

**Acceptance criteria:**
- [ ] Hook reads selected venueId from localStorage (key: "selectedVenueId")
- [ ] Hook provides `venueId: string | null` and `setVenueId(venueId: string)` function
- [ ] Hook persists venueId to localStorage on change
- [ ] Hook dispatches custom event "venueSelectionChanged" for cross-tab sync
- [ ] Hook listens for "venueSelectionChanged" event to sync across tabs
- [ ] Venue selector dropdown added to LiveScoringManagementPage
- [ ] Dropdown shows list of venues (can be hardcoded initially or loaded from Firestore)
- [ ] Selected venue persists across page reloads
- [ ] Default to first venue if none selected

**Manual test steps:**
1. Create `live-scoring/src/hooks/useVenueSelection.ts`
2. Implement hook with localStorage persistence
3. Add custom event dispatch/listen for cross-tab sync
4. Add venue selector dropdown to LiveScoringManagementPage
5. Test selecting a venue
6. Reload page - verify venue persists
7. Open same page in another tab - verify venue syncs
8. Test with no venue selected - verify default behavior

**Risk:** LOW - New hook, no impact on existing code

**Rollback:** Delete `useVenueSelection.ts` and remove venue selector UI

---

### Issue #11: Add broadcast session indicator to LiveScoringManagementPage

**Goal:** Show active broadcast session info and slot assignments in admin scoring page.

**Files to touch:**
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Add session indicator UI

**Acceptance criteria:**
- [ ] Use `useVenueSelection()` hook (from Issue #10) to get selected venueId
- [ ] Check for active session on page load using `broadcastSessionService.getActiveSessionForVenueAndDate(venueId, date)`
- [ ] Display session info badge/alert if active session exists:
  - Shows venue name and date
  - Shows "Active" status badge
- [ ] Show slot assignments next to table numbers (e.g., "Table 1 (Slot A)")
- [ ] Slot badge only shows when session is active
- [ ] Add link to session management page
- [ ] Optional: Quick session creation button (if no active session)
- [ ] No impact on existing match assignment functionality

**Manual test steps:**
1. Open `live-scoring/src/pages/LiveScoringManagementPage.tsx`
2. Import `useVenueSelection` hook
3. Get venueId from hook: `const { venueId } = useVenueSelection()`
4. Add session check in useEffect (only if venueId exists)
5. Add UI component to display session info
6. Create an active broadcast session
7. Select venue in UI (via venue selector from Issue #10)
8. Load LiveScoringManagementPage
9. Verify session info displays
10. Verify slot assignments show next to tables
11. Test with no active session (should not show slot badges)
12. Test with no venue selected (should not show session info)
13. Verify existing match assignment still works

**Risk:** LOW - UI additions only, no logic changes

**Rollback:** Remove session indicator UI from LiveScoringManagementPage.tsx

---

## Milestone: feature/overlay-slots

### Issue #12: Add slot-based route support to OverlayTVPage

**Goal:** Enable overlay to work with both table and slotId URL parameters, maintaining backward compatibility.

**Files to touch:**
- `live-scoring/src/pages/OverlayTVPage.tsx` - Add slot resolution logic

**Acceptance criteria:**
- [ ] Route `/overlay/tv/:table` still works (backward compatible)
- [ ] New route `/overlay/tv/slot/:slotId` works
- [ ] **Sequential fallback strategy** (NOT concurrent listeners):
  - **First attempt:** If `slotId` param exists, query by `where("slotId", "==", slotId) + where("status", "==", "inProgress")`
  - **Fallback:** If slotId query returns no match, query by `where("table", "==", table) + where("status", "==", "inProgress")` (legacy)
  - **Never run both queries in parallel** - only ONE Firestore listener active at a time
- [ ] Error handling: Show loading state, handle no match found
- [ ] No breaking changes to existing table-based overlays

**Manual test steps:**
1. Open `live-scoring/src/pages/OverlayTVPage.tsx`
2. Update useParams to accept both `table` and `slotId`
3. Add resolution logic
4. Test `/overlay/tv/1` (table route) - should work as before
5. Create match with slotId="A"
6. Test `/overlay/tv/slot/A` (slot route) - should display match
7. Test fallback: slotId route with no matching slotId match, should try table
8. Verify no console errors

**Risk:** MEDIUM - Changes to overlay query logic

**Rollback:** Revert changes to OverlayTVPage.tsx, keep only table-based query

---

### Issue #13: Add slot-based route support to LiveOverlayPage

**Goal:** Enable LiveOverlayPage to work with both table and slotId parameters.

**Files to touch:**
- `live-scoring/src/pages/LiveOverlayPage.tsx` - Add slot resolution logic

**Acceptance criteria:**
- [ ] Route `/overlay/:table` still works (backward compatible)
- [ ] New route `/overlay/slot/:slotId` works
- [ ] Sequential fallback strategy similar to OverlayTVPage (NOT concurrent listeners)
- [ ] Fallback to table query if slotId query fails
- [ ] No breaking changes

**Manual test steps:**
1. Open `live-scoring/src/pages/LiveOverlayPage.tsx`
2. Update useParams and query logic
3. Test `/overlay/1` (table route) - should work as before
4. Test `/overlay/slot/A` (slot route) - should display match
5. Verify fallback works

**Risk:** MEDIUM - Changes to overlay query logic

**Rollback:** Revert changes to LiveOverlayPage.tsx

---

### Issue #14: Add slot-based routes to all overlay page variants

**Goal:** Extend all overlay page components to support slot-based routes.

**Files to touch:**
- `live-scoring/src/pages/OverlayClassicPage.tsx`
- `live-scoring/src/pages/OverlayModernPage.tsx`
- `live-scoring/src/pages/OverlayMinimalPage.tsx`
- `live-scoring/src/pages/OverlaySportPage.tsx`
- `live-scoring/src/pages/OverlayElegantPage.tsx`
- `live-scoring/src/pages/OverlayHorizontalPage.tsx`
- `live-scoring/src/pages/OverlayDesignsPage.tsx`

**Acceptance criteria:**
- [ ] Each overlay page supports both `:table` and `:slotId` route parameters
- [ ] Slot-based query implemented in each page (sequential fallback, NOT concurrent listeners)
- [ ] Fallback to table query if slotId fails
- [ ] All existing table routes still work
- [ ] Consistent implementation across all pages

**Manual test steps:**
1. Update each overlay page component
2. Test each route variant:
   - `/overlay/classic/1` vs `/overlay/classic/slot/A`
   - `/overlay/modern/1` vs `/overlay/modern/slot/A`
   - (repeat for all variants)
3. Verify all work correctly
4. Verify backward compatibility

**Risk:** MEDIUM - Multiple files changed, but same pattern

**Rollback:** Revert changes to all overlay page files

---

### Issue #15: Update match assignment to set slotId and broadcastSessionId

**Goal:** When admin assigns match to table, also resolve and set slotId if active session exists.

**Files to touch:**
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Update `startMatch()` function

**Acceptance criteria:**
- [ ] Existing `startMatch()` function preserved (still sets `table` and `status: "inProgress"`)
- [ ] After setting table, check for active broadcast session
- [ ] If active session exists, resolve slotId using `SlotResolutionService.resolveTableToSlot()` (returns string, not hardcoded union)
- [ ] If slotId resolved, update match with `slotId` and `broadcastSessionId`
- [ ] If no active session, skip slot assignment (no error)
- [ ] Handle errors gracefully (log but don't block match assignment)
- [ ] No impact on existing match assignment flow

**Manual test steps:**
1. Open `live-scoring/src/pages/LiveScoringManagementPage.tsx`
2. Locate `startMatch()` function (around line 489)
3. Add slot resolution logic after table assignment
4. Create an active broadcast session with slot mappings
5. Assign a match to Table 1
6. Verify match document has `slotId` and `broadcastSessionId` set
7. Test with no active session - verify match still assigns (without slotId)
8. Test error case - verify match assignment still succeeds even if slot resolution fails

**Risk:** MEDIUM - Changes to match assignment logic

**Rollback:** Revert slot resolution code in `startMatch()` function, keep only table assignment

---

### Issue #16: Add slot-based routes to AppRouter

**Goal:** Register new slot-based overlay routes alongside existing table routes.

**Files to touch:**
- `live-scoring/src/pages/AppRouter.tsx` - Add slot routes
- `live-scoring/src/App.tsx` - Add slot routes (if AppRouter not used)

**Acceptance criteria:**
- [ ] Route `/overlay/tv/slot/:slotId` → `OverlayTVPage`
- [ ] Route `/overlay/slot/:slotId` → `LiveOverlayPage`
- [ ] Route `/overlay/classic/slot/:slotId` → `OverlayClassicPage`
- [ ] Route `/overlay/modern/slot/:slotId` → `OverlayModernPage`
- [ ] Route `/overlay/minimal/slot/:slotId` → `OverlayMinimalPage`
- [ ] Route `/overlay/sport/slot/:slotId` → `OverlaySportPage`
- [ ] Route `/overlay/elegant/slot/:slotId` → `OverlayElegantPage`
- [ ] Route `/overlay/horizontal/:design/slot/:slotId` → `OverlayHorizontalPage`
- [ ] Route `/overlay/designs/:design/slot/:slotId` → `OverlayDesignsPage`
- [ ] All existing `:table` routes remain unchanged

**Manual test steps:**
1. Add all slot-based routes to AppRouter.tsx or App.tsx
2. Test each route:
   - `/overlay/tv/slot/A`
   - `/overlay/slot/A`
   - `/overlay/classic/slot/A`
   - (repeat for all variants)
3. Verify routes work correctly
4. Verify existing `:table` routes still work

**Risk:** LOW - Adding routes only

**Rollback:** Remove slot-based route definitions

---

### Issue #17: Add Firestore indexes for matches queries

**Goal:** Add composite indexes to support efficient overlay queries by slotId and broadcastSessionId.

**Files to touch:**
- `firestore.indexes.json` - Add index definitions

**Acceptance criteria:**
- [ ] Index added: `matches` collection - `slotId` + `status` (ASC) - For slot-based overlay queries
- [ ] Index added: `matches` collection - `broadcastSessionId` + `status` (ASC) - For session-based queries
- [ ] Indexes deploy successfully via `firebase deploy --only firestore:indexes`
- [ ] Indexes support overlay queries in OverlayTVPage and other overlay pages

**Manual test steps:**
1. Edit `firestore.indexes.json`
2. Add both matches index definitions
3. Run `firebase deploy --only firestore:indexes`
4. Verify deployment succeeds
5. Check Firebase Console to confirm indexes are created
6. Test overlay queries use indexes efficiently

**Risk:** LOW - Adding indexes, no code changes

**Rollback:** Remove index definitions from `firestore.indexes.json` and redeploy

---

## Milestone: feature/tauri-control-app

### Issue #18: Initialize Tauri project structure

**Goal:** Set up Tauri project with Rust backend and React frontend.

**Files to touch:**
- `tauri-control-app/` (NEW directory) - Entire Tauri project

**Acceptance criteria:**
- [ ] Tauri project initialized in `tauri-control-app/` directory
- [ ] `tauri.conf.json` configured:
  - App name: "SQY Ping Control"
  - Bundle identifier set
  - Permissions: network, filesystem
- [ ] Rust workspace structure set up
- [ ] React + TypeScript UI setup in `ui/` directory
- [ ] Build targets configured (Windows, macOS only)
- [ ] Project builds successfully: `npm run tauri build`

**Manual test steps:**
1. Run `npm create tauri-app@latest tauri-control-app`
2. Configure project settings
3. Set up React UI
4. Test build: `cd tauri-control-app && npm run tauri build`
5. Verify build succeeds on at least one platform

**Risk:** NONE - New project, no impact on web app

**Rollback:** Delete `tauri-control-app/` directory

---

### Issue #19: Implement OBS WebSocket client in Rust

**Goal:** Create Rust service to connect and control OBS Studio via WebSocket.

**Files to touch:**
- `tauri-control-app/src/services/obs_client.rs` (NEW) - OBS client implementation
- `tauri-control-app/Cargo.toml` - Add `obs-websocket-rs` dependency

**Acceptance criteria:**
- [ ] Add `obs-websocket-rs` crate to Cargo.toml
- [ ] Implement `connect(address, port, password)` function
- [ ] Implement `disconnect()` function
- [ ] Implement `switch_scene(scene_name)` function
- [ ] Implement `set_source_visibility(source_name, visible)` function
- [ ] Implement `start_stream()` function
- [ ] Implement `stop_stream()` function
- [ ] Implement `get_status()` function (returns connection status)
- [ ] Error handling and reconnection logic
- [ ] Connection state management

**Manual test steps:**
1. Add dependency to Cargo.toml
2. Create `obs_client.rs` file
3. Implement all functions
4. Start OBS Studio with WebSocket enabled
5. Test connecting to OBS
6. Test switching scenes
7. Test source visibility
8. Test stream start/stop
9. Test error handling (disconnect OBS, verify reconnection)

**Risk:** NONE - New code in Tauri app

**Rollback:** Remove `obs_client.rs` and dependency

---

### Issue #20: Create Tauri commands for OBS control

**Goal:** Expose OBS functions as Tauri commands callable from React UI.

**Files to touch:**
- `tauri-control-app/src/commands/obs.rs` (NEW) - Tauri command handlers
- `tauri-control-app/src/main.rs` - Register commands

**Acceptance criteria:**
- [ ] Command `obs_connect(address, port, password)` - Connects to OBS
- [ ] Command `obs_disconnect()` - Disconnects from OBS
- [ ] Command `obs_switch_scene(scene_name)` - Switches OBS scene
- [ ] Command `obs_set_source_visibility(source_name, visible)` - Toggles source
- [ ] Command `obs_start_stream()` - Starts streaming
- [ ] Command `obs_stop_stream()` - Stops streaming
- [ ] Command `obs_get_status()` - Returns connection status
- [ ] All commands registered in `main.rs` via `invoke_handler!()`
- [ ] Commands return Result types for error handling

**Manual test steps:**
1. Create `commands/obs.rs`
2. Implement all command functions
3. Register in main.rs
4. Test from React UI: `invoke('obs_connect', { address: 'localhost', port: 4455 })`
5. Verify OBS connects
6. Test all commands from UI
7. Verify error handling works

**Risk:** NONE - New code in Tauri app

**Rollback:** Remove command registrations from main.rs

---

### Issue #21: Implement Firestore command listener (React/TypeScript)

**Goal:** Listen to Firestore commands collection and process commands for assigned slot using Firebase JS SDK.

**Files to touch:**
- `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (NEW) - Command listener hook
- `tauri-control-app/ui/src/services/firestoreClient.ts` (NEW) - Firestore client wrapper
- `tauri-control-app/ui/package.json` - Add Firebase JS SDK dependency

**Acceptance criteria:**
- [ ] Install Firebase JS SDK: `npm install firebase`
- [ ] Create `ui/src/services/firestoreClient.ts` to initialize Firebase app
- [ ] Create `ui/src/hooks/useCommandQueue.ts` hook
- [ ] Hook accepts `venueId`, `broadcastSessionId`, `slotId` as parameters
- [ ] **IMPORTANT:** Commands are top-level collection, scoped by venueId + broadcastSessionId + slotId
- [ ] Sets up Firestore listener: `query(commands, where("venueId", "==", venueId), where("broadcastSessionId", "==", sessionId), where("slotId", "==", slotId), where("status", "==", "pending"))`
- [ ] Returns pending commands array
- [ ] Updates command status via Firestore when processing
- [ ] When command received, invokes Rust Tauri command to execute OBS action
- [ ] Error handling for Firestore connection issues

**Manual test steps:**
1. Install Firebase JS SDK in Tauri UI
2. Create Firestore client wrapper
3. Create useCommandQueue hook
4. Integrate hook in SlotControl component
5. Create test command in Firestore with venueId, broadcastSessionId, slotId
6. Start Tauri app with matching parameters
7. Verify command is received via React hook
8. Verify command triggers Rust OBS command via `invoke()`
9. Verify command status updates correctly in Firestore

**Risk:** NONE - New code in Tauri app

**Rollback:** Remove Firestore listener hook and Firebase SDK

---

### Issue #22: Implement command processor (React/TypeScript)

**Goal:** Route commands by type and execute corresponding OBS actions via Rust Tauri commands.

**Files to touch:**
- `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (extend existing hook)

**Acceptance criteria:**
- [ ] Extend `useCommandQueue` hook from Issue #21 with command processing logic
- [ ] Route commands by type:
  - `obs_scene_switch` → invoke `obs_switch_scene` Rust command
  - `obs_source_visibility` → invoke `obs_set_source_visibility` Rust command
  - `obs_stream_start` → invoke `obs_start_stream` Rust command
  - `obs_stream_stop` → invoke `obs_stop_stream` Rust command
- [ ] Update command status:
  - Set to "processing" when starting
  - Set to "completed" or "failed" when done
- [ ] Retry logic: 3 retries with exponential backoff for failed commands
- [ ] Command status tracking
- [ ] Logging for debugging

**Manual test steps:**
1. Extend useCommandQueue hook with processing logic
2. Create test commands in Firestore
3. Verify commands are routed correctly by type
4. Verify OBS actions execute via Rust commands
5. Test retry logic (simulate OBS disconnect)
6. Verify command status updates correctly

**Risk:** NONE - New code in Tauri app

**Rollback:** Remove command processing logic from hook

---

### Issue #23: Implement agent heartbeat system (React/TypeScript)

**Goal:** Send periodic heartbeat updates to Firestore to indicate agent is alive using Firebase JS SDK.

**Files to touch:**
- `tauri-control-app/ui/src/hooks/useHeartbeat.ts` (NEW) - Heartbeat sender hook

**Acceptance criteria:**
- [ ] Create `ui/src/hooks/useHeartbeat.ts` hook
- [ ] Hook accepts `agentId`, `venueId`, `broadcastSessionId`, `slotId`, `obsStatus` as parameters
- [ ] **IMPORTANT:** Heartbeats are top-level collection, scoped by venueId + broadcastSessionId + slotId
- [ ] Uses `setInterval` to send heartbeat every 5 seconds
- [ ] Updates Firestore document: `agentHeartbeats/{agentId}`
- [ ] Document includes: `agentId`, `venueId`, `broadcastSessionId`, `slotId`, `obsStatus`, `lastSeen`, `capabilities`, `metadata`
- [ ] Cleanup interval on component unmount
- [ ] Stops when app closes

**Manual test steps:**
1. Create `useHeartbeat.ts` hook
2. Integrate hook in SlotControl component
3. Start Tauri app
4. Verify heartbeats appear in Firestore
5. Verify `lastSeen` updates every 5 seconds
6. Stop app, verify heartbeats stop
7. Check Firestore for stale agents (lastSeen > 60 seconds)

**Risk:** NONE - New code in Tauri app

**Rollback:** Remove heartbeat hook

---

### Issue #24: Add AgentHeartbeat types and Firestore indexes for agentHeartbeats

**Goal:** Add the AgentHeartbeat TypeScript interface and Firestore composite indexes for the top-level `agentHeartbeats` collection. Scoping: **venueId + broadcastSessionId + slotId** (top-level collection, not a subcollection).

**Files to touch:**
- `live-scoring/src/types/broadcast.ts` - Add AgentHeartbeat interface (and export)
- `firestore.indexes.json` - Add agentHeartbeats index definitions

**Acceptance criteria:**
- [ ] `AgentHeartbeat` interface defined with **venueId**, **broadcastSessionId**, **slotId** (all required for scoping), plus agentId, obsStatus, lastSeen, capabilities, metadata
- [ ] **IMPORTANT:** agentHeartbeats is a **top-level** Firestore collection; all documents MUST include venueId, broadcastSessionId, slotId
- [ ] Index added: `agentHeartbeats` - `venueId` + `broadcastSessionId` + `slotId` + `lastSeen` (DESC)
- [ ] Index added: `agentHeartbeats` - `venueId` + `broadcastSessionId` + `slotId` (ASC)
- [ ] Indexes deploy successfully via `firebase deploy --only firestore:indexes`
- [ ] Indexes support heartbeat queries in Tauri app and admin UI

**Manual test steps:**
1. Add AgentHeartbeat interface to `types/broadcast.ts`
2. Edit `firestore.indexes.json` and add the two agentHeartbeats indexes
3. Run `firebase deploy --only firestore:indexes`
4. Verify deployment succeeds
5. Verify Tauri heartbeat writes and admin queries use indexes

**Risk:** LOW - Additive types and indexes

**Rollback:** Remove AgentHeartbeat from types and index definitions; redeploy indexes

---

### Issue #25: Create Tauri UI components

**Goal:** Build React UI for Tauri app to display slot control, OBS status, and command queue.

**Files to touch:**
- `tauri-control-app/ui/src/components/SlotControl.tsx` (NEW)
- `tauri-control-app/ui/src/components/OBSStatus.tsx` (NEW)
- `tauri-control-app/ui/src/components/CommandQueue.tsx` (NEW)
- `tauri-control-app/ui/src/pages/Dashboard.tsx` (NEW)
- `tauri-control-app/ui/src/pages/Settings.tsx` (NEW)
- `tauri-control-app/ui/src/hooks/useOBS.ts` (NEW)
- `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (NEW)

**Acceptance criteria:**
- [ ] `SlotControl` component displays slot ID, OBS connection status, controls
- [ ] `OBSStatus` component shows connection status, current scene
- [ ] `CommandQueue` component lists pending/processing/completed commands
- [ ] `Dashboard` page shows 4 SlotControl components (A/B/C/D)
- [ ] `Settings` page for OBS connection configuration
- [ ] `useOBS` hook manages OBS connection state
- [ ] `useCommandQueue` hook manages command queue state
- [ ] UI styled with Material-UI or similar

**Manual test steps:**
1. Create all component files
2. Implement components
3. Build Tauri app
4. Launch app
5. Verify UI displays correctly
6. Test connecting to OBS
7. Verify status updates in real-time
8. Test command queue display

**Risk:** NONE - New UI in Tauri app

**Rollback:** Remove UI component files

---

### Issue #26: Configure Tauri build and packaging

**Goal:** Set up builds for Windows and macOS with CI/CD.

**Files to touch:**
- `tauri-control-app/tauri.conf.json` - Build configuration
- `tauri-control-app/.github/workflows/build.yml` (NEW) - CI/CD workflow

**Acceptance criteria:**
- [ ] Windows build produces `.exe` installer and portable `.zip`
- [ ] macOS build produces `.dmg` and `.app` bundle
- [ ] GitHub Actions workflow builds on Windows and macOS runners only
- [ ] Builds succeed without errors
- [ ] Artifacts uploaded to GitHub Releases

**Manual test steps:**
1. Configure `tauri.conf.json` for Windows and macOS only
2. Create GitHub Actions workflow (Windows + macOS runners)
3. Test local build: `npm run tauri build`
4. Push to GitHub
5. Verify CI builds succeed
6. Download and test built artifacts

**Risk:** NONE - Build configuration only

**Rollback:** Remove GitHub Actions workflow, keep local builds

---

## Milestone: feature/command-integration

### Issue #27: Add Command types and Firestore indexes for commands

**Goal:** Add the Command and CommandType TypeScript types and Firestore composite indexes for the top-level `commands` collection. Scoping: **venueId + broadcastSessionId + slotId** (top-level collection, not a subcollection).

**Files to touch:**
- `live-scoring/src/types/broadcast.ts` - Add CommandType, Command interface (and export)
- `firestore.indexes.json` - Add commands index definitions

**Acceptance criteria:**
- [ ] `CommandType` union type defined (e.g. obs_scene_switch, obs_source_visibility, obs_stream_start, obs_stream_stop, youtube_go_live)
- [ ] `Command` interface defined with **venueId**, **broadcastSessionId**, **slotId** (all required for scoping), plus id, type, payload, status, createdAt, processedAt, processedBy, error
- [ ] **IMPORTANT:** commands is a **top-level** Firestore collection; all documents MUST include venueId, broadcastSessionId, slotId
- [ ] Index added: `commands` - `venueId` + `broadcastSessionId` + `slotId` + `status` + `createdAt` (ASC)
- [ ] Index added: `commands` - `venueId` + `broadcastSessionId` + `slotId` + `status` (ASC)
- [ ] Indexes deploy successfully via `firebase deploy --only firestore:indexes`
- [ ] Indexes support command creation and listener queries in web app and Tauri app

**Manual test steps:**
1. Add CommandType and Command to `types/broadcast.ts`
2. Edit `firestore.indexes.json` and add the two commands indexes
3. Run `firebase deploy --only firestore:indexes`
4. Verify deployment succeeds
5. Verify CommandService and Tauri command listener can use indexes

**Risk:** LOW - Additive types and indexes

**Rollback:** Remove Command/CommandType from types and index definitions; redeploy indexes

---

### Issue #28: Create CommandService in web app

**Goal:** Create service to create and manage commands in Firestore.

**Files to touch:**
- `live-scoring/src/services/commandService.ts` (NEW) - Command service

**Acceptance criteria:**
- [ ] `createCommand(commandData)` - Creates command document in Firestore top-level collection
- [ ] **IMPORTANT:** Commands are top-level collection, MUST include `venueId`, `broadcastSessionId`, `slotId`
- [ ] `getCommandsBySlot(venueId, sessionId, slotId)` - Retrieves commands for a slot (filters by all three fields)
- [ ] `updateCommandStatus(commandId, status)` - Updates command status
- [ ] Command types enum defined
- [ ] All functions use Firestore with proper error handling
- [ ] Commands created with required fields: `venueId`, `broadcastSessionId`, `slotId`, `type`, `payload`, `status`, `createdAt` (serverTimestamp); support leasing fields: processedBy, leaseUntil, attemptCount, lastError, completedAt

**Manual test steps:**
1. Create `commandService.ts`
2. Implement all functions
3. Create a test command via `createCommand()`
4. Verify command appears in Firestore
5. Retrieve commands via `getCommandsBySlot()`
6. Update command status
7. Verify status updates in Firestore

**Risk:** LOW - New service, not yet integrated

**Rollback:** Delete `commandService.ts`

---

### Issue #29: Implement command leasing (claim transaction) and idempotent processing

**Goal:** Prevent duplicate command consumption: agents claim commands in a Firestore transaction (leaseUntil, attemptCount); process idempotently (set/absolute actions only).

**Files to touch:**
- `tauri-control-app/ui/src/hooks/useCommandQueue.ts` - Claim transaction, lease fields, completedAt serverTimestamp
- Command type/interface: add leaseUntil, attemptCount, lastError, completedAt (serverTimestamp)

**Acceptance criteria:**
- [ ] "Claim command" implemented as **Firestore transaction**: allowed if status is pending OR (processing AND leaseUntil < now); set status=processing, processedBy=agentId, leaseUntil=now+30s, increment attemptCount
- [ ] On completion: update status to completed/failed, set completedAt (serverTimestamp), lastError if failed
- [ ] All OBS actions **idempotent** (e.g. switch to scene X, set source visible true/false – never toggle)
- [ ] Retry strategy: expired lease allows re-claim; optional cap on attemptCount

**Manual test steps (duplicate prevention):**
1. Create a pending command; start two Tauri instances for same slot
2. Verify only one processes it (claim transaction)
3. Simulate Wi-Fi drop (stop network), then recover – verify lease expiry and re-claim or retry

**Risk:** LOW - Additive safety

**Rollback:** Revert to non-transactional claim

---

### Issue #30: Create OBS commands when match starts

**Goal:** Automatically create OBS control commands when admin starts a match.

**Files to touch:**
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Update `startMatch()` function

**Acceptance criteria:**
- [ ] After setting `slotId` on match, create commands if slotId exists
- [ ] **IMPORTANT:** Commands MUST include `venueId`, `broadcastSessionId`, `slotId` from active session
- [ ] Create command: `obs_scene_switch` with payload `{ sceneName: "Match Active" }`
- [ ] Create command: `obs_source_visibility` with payload `{ sourceName: "Overlay Browser", visible: true }`
- [ ] Create command: `obs_stream_start` (optional, configurable)
- [ ] Commands created with all required fields: `venueId`, `broadcastSessionId`, `slotId`, `type`, `payload`, `status: "pending"`
- [ ] Handle command creation errors gracefully (log but don't block match assignment)
- [ ] No impact if Tauri app not running (commands queue in Firestore)

**Manual test steps:**
1. Open `LiveScoringManagementPage.tsx`
2. Locate `startMatch()` function
3. Add command creation after slotId assignment
4. Create active broadcast session
5. Start a match
6. Verify commands appear in Firestore
7. Verify commands have correct slotId
8. Test with no active session (should not create commands)
9. Test error case (simulate commandService failure)

**Risk:** LOW - Additive changes, match assignment still works without commands

**Rollback:** Remove command creation code from `startMatch()` function

---

### Issue #31: Create OBS commands when match finishes

**Goal:** Automatically create commands to switch scenes when match ends.

**Files to touch:**
- `live-scoring/src/components/MatchScoreCard.tsx` - Update match finish logic
- OR `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Update `stopMatch()` function

**Acceptance criteria:**
- [ ] When match finishes (status becomes "finished"), create commands if slotId exists
- [ ] Create command: `obs_scene_switch` with payload `{ sceneName: "Idle" }`
- [ ] Create command: `obs_source_visibility` with payload `{ sourceName: "Overlay Browser", visible: false }`
- [ ] Create command: `obs_stream_stop` (optional)
- [ ] Commands use match's `slotId` and include `venueId`, `broadcastSessionId` from active session
- [ ] Handle errors gracefully

**Manual test steps:**
1. Locate match finish logic (MatchScoreCard or stopMatch)
2. Add command creation
3. Finish a match that has slotId
4. Verify commands created in Firestore
5. Test with match that has no slotId (should not create commands)

**Risk:** LOW - Additive changes

**Rollback:** Remove command creation code

---

### Issue #32: Firestore security rules (admin/operator, venueIds)

**Goal:** Enforce minimum viable security: custom claims (role, venueIds); admin creates commands; operator updates only leasing/status and upserts own heartbeat.

**Files to touch:**
- `firestore.rules`

**Acceptance criteria:**
- [ ] Rules assume Firebase Auth with custom claims: `role` ("admin" | "operator"), `venueIds` (string[])
- [ ] **commands:** Admin can create (venueId in venueIds). Operator can read for allowed venues; can update ONLY status, processedBy, leaseUntil, attemptCount, lastError, completedAt – cannot change venueId, broadcastSessionId, slotId, type, payload
- [ ] **agentHeartbeats:** Operator can upsert only own doc (e.g. agentId == auth.uid) for allowed venueId; admin can read
- [ ] **broadcastSessions / activeSessions:** Define read/write for admin (and optionally operator) as needed
- [ ] Deploy and smoke-test in emulator

**Manual test steps:** Use emulator; verify admin create command, operator update status only, operator cannot change payload; operator can write only own heartbeat for allowed venue

**Risk:** MEDIUM - Security-critical

**Rollback:** Revert rules to previous version

---

### Issue #33: Firestore emulator tests for security rules

**Goal:** Automated tests for rules: admin create command, operator cannot change intent, operator can claim/complete, operator own heartbeat only.

**Files to touch:**
- Test file (e.g. Jest + @firebase/rules-unit-testing or Firebase emulator test script)

**Acceptance criteria:**
- [ ] Test: admin can create command (with venueId in venueIds)
- [ ] Test: operator cannot update command venueId, broadcastSessionId, slotId, type, payload
- [ ] Test: operator can update command status, processedBy, leaseUntil, attemptCount, lastError, completedAt
- [ ] Test: operator can upsert only own agentHeartbeats doc for allowed venue
- [ ] All tests run in Firestore emulator and pass

**Risk:** LOW

**Rollback:** Remove test file

---

### Issue #34: Add command status UI to LiveScoringManagementPage

**Goal:** Display command queue and agent status in admin page.

**Files to touch:**
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Add command status display
- `live-scoring/src/hooks/useAgentStatus.ts` (NEW) - Agent status hook

**Acceptance criteria:**
- [ ] Create `useAgentStatus` hook to monitor agent heartbeats
- [ ] Display command status per slot:
  - Pending commands count
  - Processing commands count
  - Completed commands count
  - Failed commands count (with retry button)
- [ ] Display agent status per slot:
  - "Active" if lastSeen < 60 seconds ago (offline threshold 60s)
  - "Offline" if lastSeen > 60 seconds ago
  - "No agent" if no heartbeat exists
- [ ] Real-time updates via Firestore listeners
- [ ] UI shows status badges/icons

**Manual test steps:**
1. Create `useAgentStatus.ts` hook
2. Add command status UI to LiveScoringManagementPage
3. Create test commands
4. Verify command counts display correctly
5. Start Tauri app
6. Verify agent status shows "Active"
7. Stop Tauri app
8. Verify agent status shows "Offline" after 60 seconds
9. Test retry button for failed commands

**Risk:** LOW - UI additions only

**Rollback:** Remove command status UI and hook

---

## Milestone: feature/obs-packaging

### Issue #35: Create OBS configuration templates per slot

**Goal:** Create OBS Studio configuration files for each slot (A/B/C/D) with correct WebSocket ports and browser sources.

**Files to touch:**
- `obs-portable-configs/` (NEW directory) - OBS configuration templates

**Acceptance criteria:**
- [ ] Config directory for Slot A with WebSocket port 4455
- [ ] Config directory for Slot B with WebSocket port 4456
- [ ] Config directory for Slot C with WebSocket port 4457
- [ ] Config directory for Slot D with WebSocket port 4458
- [ ] Each config has browser source pointing to slot overlay URL:
  - Slot A: `/overlay/tv/slot/A` or `/overlay/slot/A`
  - Slot B: `/overlay/tv/slot/B` or `/overlay/slot/B`
  - Slot C: `/overlay/tv/slot/C` or `/overlay/slot/C`
  - Slot D: `/overlay/tv/slot/D` or `/overlay/slot/D`
- [ ] Scene templates: "Match Active", "Idle", "Next Match"
- [ ] Configuration documented

**Manual test steps:**
1. Create `obs-portable-configs/` directory
2. Create config directories for each slot
3. Configure OBS WebSocket ports
4. Set up browser sources with correct URLs
5. Create scene templates
6. Test loading config in OBS Studio
7. Verify WebSocket ports don't conflict
8. Verify browser sources load overlays

**Risk:** NONE - Configuration files only

**Rollback:** Delete `obs-portable-configs/` directory

---

### Issue #36: Create Windows OBS portable package

**Goal:** Package OBS Studio portable for Windows with slot-specific configurations.

**Files to touch:**
- `obs-portable-configs/windows/` (NEW) - Windows packaging

**Acceptance criteria:**
- [ ] OBS Studio portable downloaded/extracted
- [ ] Batch scripts: `start-obs-slot-a.bat`, `start-obs-slot-b.bat`, `start-obs-slot-c.bat`, `start-obs-slot-d.bat`
- [ ] Scripts configure OBS to use slot-specific config directory
- [ ] Package as `obs-portable-windows.zip`
- [ ] README with installation instructions

**Manual test steps:**
1. Download OBS Studio portable for Windows
2. Create batch scripts
3. Test starting each slot instance
4. Verify WebSocket ports are correct
5. Verify browser sources work
6. Package as zip
7. Test extracting and running on clean Windows machine

**Risk:** NONE - Packaging only

**Rollback:** Delete Windows packaging directory

---

### Issue #37: Create macOS OBS portable package

**Goal:** Package OBS Studio for macOS with slot-specific configurations.

**Files to touch:**
- `obs-portable-configs/macos/` (NEW) - macOS packaging

**Acceptance criteria:**
- [ ] OBS Studio app bundle or installation
- [ ] Shell scripts: `start-obs-slot-a.sh`, etc.
- [ ] Scripts configure OBS to use slot-specific config
- [ ] Package as `obs-portable-macos.tar.gz`
- [ ] README with installation instructions

**Manual test steps:**
1. Download OBS Studio for macOS
2. Create shell scripts
3. Test starting each slot instance
4. Verify configuration works
5. Package as tar.gz
6. Test on clean macOS machine

**Risk:** NONE - Packaging only

**Rollback:** Delete macOS packaging directory

---

### Issue #38: Create OBS setup documentation

**Goal:** Document OBS installation, configuration, and troubleshooting.

**Files to touch:**
- `docs/obs-setup.md` (NEW) - OBS setup guide

**Acceptance criteria:**
- [ ] Installation steps for Windows
- [ ] Installation steps for macOS
- [ ] Configuration steps per slot
- [ ] Browser source setup instructions
- [ ] WebSocket configuration
- [ ] Scene setup guide
- [ ] Troubleshooting section
- [ ] Common issues and solutions

**Manual test steps:**
1. Create `docs/obs-setup.md`
2. Write comprehensive documentation
3. Follow instructions on clean machine
4. Verify all steps work
5. Update documentation based on testing

**Risk:** NONE - Documentation only

**Rollback:** Delete `docs/obs-setup.md`

---

## Milestone: feature/youtube-automation (Optional - Future)

### Issue #39: Set up YouTube API client in Rust

**Goal:** Create YouTube API client for future stream automation.

**Files to touch:**
- `tauri-control-app/src/services/youtube_client.rs` (NEW) - YouTube API client
- `tauri-control-app/Cargo.toml` - Add YouTube API dependency

**Acceptance criteria:**
- [ ] YouTube API client dependency added
- [ ] OAuth flow for channel access
- [ ] Function to create live stream event
- [ ] Function to set stream title/description
- [ ] Function to get stream key
- [ ] Error handling

**Manual test steps:**
1. Add YouTube API dependency
2. Implement OAuth flow
3. Test creating live stream
4. Test setting metadata
5. Verify stream key retrieval

**Risk:** NONE - Future feature, not blocking

**Rollback:** Remove YouTube client code

---

### Issue #40: Implement YouTube go-live command

**Goal:** Create command to automatically start YouTube live stream when match starts.

**Files to touch:**
- `tauri-control-app/src/services/command_processor.rs` - Add YouTube command handling
- `live-scoring/src/services/commandService.ts` - Add YouTube command type

**Acceptance criteria:**
- [ ] Command type `youtube_go_live` defined
- [ ] Command processor handles YouTube commands
- [ ] Creates YouTube live stream event
- [ ] Sets title from match data
- [ ] Sets description from match data
- [ ] Returns stream key for OBS

**Manual test steps:**
1. Implement YouTube command handling
2. Create test command
3. Verify YouTube stream created
4. Verify metadata set correctly
5. Test stream key integration with OBS

**Risk:** NONE - Future feature

**Rollback:** Remove YouTube command handling

---

## Cross-Cutting Issues

### Issue #41: Update Firestore security rules

**Goal:** Add secure rules for new collections (broadcastSessions, commands, agentHeartbeats).

**Files to touch:**
- `firestore.rules` - Add rules for new collections

**Acceptance criteria:**
- [ ] Rules for `broadcastSessions`: authenticated read, admin write
- [ ] Rules for `commands`: authenticated read, authenticated create, slot-scoped update
- [ ] Rules for `agentHeartbeats`: authenticated read, agent-scoped write
- [ ] Rules tested in Firestore emulator
- [ ] Rules deployed successfully

**Manual test steps:**
1. Update `firestore.rules`
2. Test rules in emulator
3. Verify read/write permissions work correctly
4. Test unauthorized access is blocked
5. Deploy rules: `firebase deploy --only firestore:rules`

**Risk:** MEDIUM - Security rules, must test thoroughly

**Rollback:** Revert to previous rules version

---

### Issue #42: Add error handling and logging

**Goal:** Implement consistent error handling across all new services and components.

**Files to touch:**
- All new service files
- All new page components
- `live-scoring/src/utils/errorHandler.ts` (NEW) - Centralized error handling

**Acceptance criteria:**
- [ ] Error boundaries in React components
- [ ] Try-catch blocks in all service functions
- [ ] Error logging service
- [ ] User-friendly error messages
- [ ] Graceful degradation (fallback to table if slot resolution fails)

**Manual test steps:**
1. Create error handling utilities
2. Add error boundaries to components
3. Test error scenarios
4. Verify user-friendly messages
5. Verify graceful degradation works

**Risk:** LOW - Error handling improvements

**Rollback:** Remove error handling code (not breaking)

---

### Issue #43: Add performance optimizations

**Goal:** Optimize Firestore queries and add caching where appropriate.

**Files to touch:**
- `live-scoring/src/services/slotResolutionService.ts` - Add caching
- All overlay page components - Optimize queries

**Acceptance criteria:**
- [ ] Slot mappings cached with 5-minute TTL
- [ ] Firestore queries use proper indexes
- [ ] Batch command creation where possible
- [ ] Lazy load overlay components
- [ ] Query response time < 500ms

**Manual test steps:**
1. Add caching to slot resolution
2. Verify cache works correctly
3. Test query performance
4. Verify indexes are used
5. Measure query response times

**Risk:** LOW - Performance improvements

**Rollback:** Remove caching (not breaking)

---

### Issue #44: Update documentation

**Goal:** Document slot system architecture and usage.

**Files to touch:**
- `README.md` - Add slot system overview
- `docs/ARCHITECTURE.md` (NEW) - Document slot architecture
- `docs/DEPLOYMENT.md` (NEW) - Add Tauri app deployment
- `docs/API.md` (NEW) - Document command API
- `docs/TROUBLESHOOTING.md` (NEW) - Add slot-related issues

**Acceptance criteria:**
- [ ] README updated with slot system overview
- [ ] Architecture document explains slot system
- [ ] Deployment guide includes Tauri app
- [ ] API documentation for commands
- [ ] Troubleshooting guide for common issues

**Manual test steps:**
1. Update/create documentation files
2. Review for accuracy
3. Test following instructions
4. Update based on feedback

**Risk:** NONE - Documentation only

**Rollback:** Revert documentation changes
