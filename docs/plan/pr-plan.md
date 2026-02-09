# PR Implementation Plan

This document provides detailed, agent-executable implementation tasks for each PR milestone. Each task is specific, unambiguous, and can be executed independently.

---

## PR #1: feature/slot-infrastructure

**Branch:** `feature/slot-infrastructure`  
**Base:** `main` or `develop`  
**Dependencies:** None  
**Estimated time:** 1-2 weeks

### Implementation Tasks

#### Task 1.1: Add slotId and broadcastSessionId to Match type

**File:** `live-scoring/src/types.ts`

**Steps:**
1. Open `live-scoring/src/types.ts`
2. Locate the `Match` interface definition
3. Add optional field: `slotId?: string;`
4. Add optional field: `broadcastSessionId?: string;`
5. Add JSDoc comment: `/** Slot ID (A/B/C/D) for streaming. Only set when match is assigned during an active broadcast session. */`
6. Add JSDoc comment: `/** ID of the broadcast session this match belongs to. Only set when match is assigned during an active broadcast session. */`
7. Verify TypeScript compilation: `cd live-scoring && npm run build`

**Verification:**
- [ ] Match interface includes both optional fields
- [ ] TypeScript compiles without errors
- [ ] Existing code using Match type still works

---

#### Task 1.2: Create broadcast type definitions

**File:** `live-scoring/src/types/broadcast.ts` (NEW)

**Steps:**
1. Create directory `live-scoring/src/types/` if it doesn't exist
2. Create file `live-scoring/src/types/broadcast.ts`
3. Add **only** the following TypeScript types and interfaces (do **not** add Command, AgentHeartbeat, or CommandType in PR #1):

```typescript
// SlotId is a flexible string type, not hardcoded union
// Examples may use "A", "B", "C", "D" but any string is valid
export type SlotId = string;

export interface SlotMapping {
  slotId: SlotId; // string type - configured per session (examples: "A", "B", "C", "D")
  physicalTable: number;
  cameraKitId?: string;
  obsInstanceId?: string;
  isActive: boolean;
}

export interface BroadcastSession {
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
```

4. Export only SlotId, SlotMapping, and BroadcastSession
5. Verify TypeScript compilation

**Verification:**
- [ ] Only SlotId, SlotMapping, and BroadcastSession defined and exported (no Command, AgentHeartbeat, or CommandType)
- [ ] TypeScript compiles without errors

---

#### Task 1.3: Add Firestore indexes

**File:** `firestore.indexes.json`

**Steps:**
1. Open `firestore.indexes.json`
2. Locate the `indexes` array
3. Add the following index definitions:

```json
{
  "collectionGroup": "broadcastSessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "venueId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

**Note:** PR #1 adds only this single index. Other indexes (matches, commands, agentHeartbeats) are introduced in later PRs.

4. Verify JSON syntax is valid
5. Deploy indexes: `firebase deploy --only firestore:indexes`

**Verification:**
- [ ] Only 1 index added to firestore.indexes.json (broadcastSessions: venueId + date + status)
- [ ] JSON syntax valid
- [ ] Index deploys successfully
- [ ] Index visible in Firebase Console
- [ ] Index supports `getActiveSessionForVenueAndDate` query in BroadcastSessionService

---

#### Task 1.4: Implement SlotResolutionService

**File:** `live-scoring/src/services/slotResolutionService.ts` (NEW)

**Steps:**
1. Create directory `live-scoring/src/services/` if it doesn't exist
2. Create file `live-scoring/src/services/slotResolutionService.ts`
3. Import dependencies:

```typescript
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { BroadcastSession, SlotMapping } from "../types/broadcast";
```

**Note:** SlotResolutionService does NOT retrieve active sessions. Use `BroadcastSessionService.getActiveSessionForVenueAndDate()` for that purpose. This service only resolves mappings given an existing sessionId.

4. Implement `resolveSlotToTable(slotId: string, sessionId: string)`:

```typescript
export async function resolveSlotToTable(
  slotId: string, // string type, not hardcoded union
  sessionId: string
): Promise<number | null> {
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return null;
    const session = sessionDoc.data() as BroadcastSession;
    const mapping = session.slotMappings.find(m => m.slotId === slotId && m.isActive);
    return mapping?.physicalTable ?? null;
  } catch (error) {
    console.error("Error resolving slot to table:", error);
    return null;
  }
}
```

5. Implement `resolveTableToSlot(table: number, sessionId: string)`:

```typescript
export async function resolveTableToSlot(
  table: number,
  sessionId: string
): Promise<string | null> { // Returns string, not hardcoded union type
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return null;
    const session = sessionDoc.data() as BroadcastSession;
    const mapping = session.slotMappings.find(
      m => m.physicalTable === table && m.isActive
    );
    return mapping?.slotId ?? null;
  } catch (error) {
    console.error("Error resolving table to slot:", error);
    return null;
  }
}
```

6. Implement `getSlotMappings(sessionId: string)`:

```typescript
export async function getSlotMappings(
  sessionId: string
): Promise<SlotMapping[]> {
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return [];
    const session = sessionDoc.data() as BroadcastSession;
    return session.slotMappings.filter(m => m.isActive);
  } catch (error) {
    console.error("Error getting slot mappings:", error);
    return [];
  }
}
```

7. Verify TypeScript compilation

**Verification:**
- [ ] All three functions implemented (resolveSlotToTable, resolveTableToSlot, getSlotMappings)
- [ ] NO getActiveSession function (use BroadcastSessionService instead)
- [ ] Error handling in place
- [ ] TypeScript compiles without errors
- [ ] Functions return null on error (not throw)

---

#### Task 1.5: Implement BroadcastSessionService

**File:** `live-scoring/src/services/broadcastSessionService.ts` (NEW)

**Steps:**
1. Create file `live-scoring/src/services/broadcastSessionService.ts`
2. Import dependencies:

```typescript
import { db } from "../config/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import type { BroadcastSession, SlotMapping } from "../types/broadcast";
```

3. Implement `createSession(sessionData: Omit<BroadcastSession, "id" | "createdAt" | "updatedAt">)`:

```typescript
export async function createSession(
  sessionData: Omit<BroadcastSession, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const sessionsRef = collection(db, "broadcastSessions");
  const now = Date.now();
  const docRef = await addDoc(sessionsRef, {
    ...sessionData,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}
```

4. Implement `updateSession(sessionId: string, updates: Partial<BroadcastSession>)`:

```typescript
export async function updateSession(
  sessionId: string,
  updates: Partial<BroadcastSession>
): Promise<void> {
  const sessionRef = doc(db, "broadcastSessions", sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}
```

5. Implement `getSession(sessionId: string)`:

```typescript
export async function getSession(sessionId: string): Promise<BroadcastSession | null> {
  const sessionRef = doc(db, "broadcastSessions", sessionId);
  const sessionDoc = await getDoc(sessionRef);
  if (!sessionDoc.exists()) return null;
  return { id: sessionDoc.id, ...sessionDoc.data() } as BroadcastSession;
}
```

6. Implement `getActiveSessionForVenueAndDate(venueId: string, date: string)`:

```typescript
/**
 * Get active broadcast session for a venue and date.
 * Query MUST filter by venueId + date + status to enforce concurrency rule.
 */
export async function getActiveSessionForVenueAndDate(
  venueId: string,
  date: string
): Promise<BroadcastSession | null> {
  const sessionsRef = collection(db, "broadcastSessions");
  const q = query(
    sessionsRef,
    where("venueId", "==", venueId),
    where("date", "==", date),
    where("status", "==", "active")
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  // Should return at most one document (enforced by activateSession)
  if (snapshot.size > 1) {
    console.warn("Multiple active sessions found for venue/date - data inconsistency");
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BroadcastSession;
}
```

7. Implement `activateSession(sessionId: string)`:

```typescript
/**
 * Activate a broadcast session.
 * Enforces multi-venue concurrency rule: Only ONE active session per venue per date.
 * MUST deactivate any other active session for the same venueId AND date.
 */
export async function activateSession(sessionId: string): Promise<void> {
  // First, get the session to retrieve venueId and date
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  // Deactivate any other active session for the same venue/date
  const sessionsRef = collection(db, "broadcastSessions");
  const otherActiveQuery = query(
    sessionsRef,
    where("venueId", "==", session.venueId),
    where("date", "==", session.date),
    where("status", "==", "active")
  );
  const otherActiveSnapshot = await getDocs(otherActiveQuery);
  
  // Deactivate all other active sessions (except the one we're activating)
  const deactivationPromises = otherActiveSnapshot.docs
    .filter(doc => doc.id !== sessionId)
    .map(doc => updateDoc(doc.ref, { status: "completed", updatedAt: Date.now() }));
  
  await Promise.all(deactivationPromises);
  
  // Now activate this session
  await updateSession(sessionId, { status: "active" });
}
```

8. Implement `deactivateSession(sessionId: string)`:

```typescript
export async function deactivateSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  const newStatus = session.status === "active" ? "completed" : "scheduled";
  await updateSession(sessionId, { status: newStatus });
}
```

9. Verify TypeScript compilation

**Verification:**
- [ ] All six functions implemented
- [ ] Error handling in place
- [ ] TypeScript compiles without errors
- [ ] Functions handle Firestore errors gracefully

---

**PR #1 Acceptance Criteria:**
- [ ] Match type extended with optional `slotId` and `broadcastSessionId` only; no other Match changes
- [ ] Broadcast types: only SlotId (string), SlotMapping, and BroadcastSession defined in `types/broadcast.ts`; no Command, AgentHeartbeat, or CommandType in this PR
- [ ] SlotResolutionService implements resolveSlotToTable, resolveTableToSlot, getSlotMappings (no getActiveSession)
- [ ] BroadcastSessionService implements createSession, updateSession, getSession, getActiveSessionForVenueAndDate, activateSession, deactivateSession
- [ ] Only one Firestore index added: broadcastSessions (venueId + date + status)
- [ ] No breaking changes to existing Match queries
- [ ] Existing overlay routes still work

**PR #1 Testing:**
- [ ] TypeScript compilation succeeds
- [ ] Firestore rules allow new collections
- [ ] Can create test broadcast session
- [ ] Can create test slot mappings
- [ ] Slot resolution returns correct mappings

**Note:** Command and AgentHeartbeat types will be introduced later:
- AgentHeartbeat types in PR #4 (tauri-control-app)
- Command types in PR #5 (command-integration)

---

## PR #2: feature/broadcast-sessions

**Branch:** `feature/broadcast-sessions`  
**Base:** `feature/slot-infrastructure`  
**Dependencies:** PR #1  
**Estimated time:** 1 week

### Implementation Tasks

#### Task 2.1: Create BroadcastSessionsListPage component

**File:** `live-scoring/src/pages/BroadcastSessionsListPage.tsx` (NEW)

**Steps:**
1. Create file `live-scoring/src/pages/BroadcastSessionsListPage.tsx`
2. Import dependencies:

```typescript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Add, Edit, Delete, PlayArrow } from "@mui/icons-material";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { broadcastSessionService } from "../services/broadcastSessionService";
import type { BroadcastSession } from "../types/broadcast";
```

3. Implement component with state:

```typescript
export default function BroadcastSessionsListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<BroadcastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    const sessionsRef = collection(db, "broadcastSessions");
    const q = query(sessionsRef, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as BroadcastSession)
      );
      setSessions(sessionsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleActivate = async (sessionId: string) => {
    await broadcastSessionService.activateSession(sessionId);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    // Implement delete logic
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "scheduled": return "default";
      case "completed": return "info";
      default: return "default";
    }
  };

  if (loading) return <Box>Loading...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <h1>Broadcast Sessions</h1>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/broadcast-sessions/new")}
        >
          Create Session
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Venue</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.venueName}</TableCell>
                <TableCell>{session.date}</TableCell>
                <TableCell>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status) as any}
                  />
                </TableCell>
                <TableCell>
                  {session.status === "scheduled" && (
                    <IconButton
                      onClick={() => handleActivate(session.id)}
                      color="primary"
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => navigate(`/broadcast-sessions/${session.id}/edit`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSessionToDelete(session.id);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Delete confirmation dialog */}
    </Box>
  );
}
```

4. Add delete confirmation dialog
5. Verify TypeScript compilation

**Verification:**
- [ ] Component renders list of sessions
- [ ] Real-time updates work
- [ ] Activate button works
- [ ] Delete confirmation works
- [ ] Navigation works

---

#### Task 2.2: Create BroadcastSessionFormPage component

**File:** `live-scoring/src/pages/BroadcastSessionFormPage.tsx` (NEW)

**Steps:**
1. Create file `live-scoring/src/pages/BroadcastSessionFormPage.tsx`
2. Import dependencies (Material-UI, React Router, Firestore, hooks)
3. Implement form with:
   - Venue name TextField
   - Date DatePicker
   - Start time TimePicker
   - End time TimePicker (optional)
   - 4 slot mapping dropdowns (A/B/C/D → Table)
4. Load available tables from `useCurrentEncounter()` hook
5. Add validation: no duplicate table assignments
6. Implement save/create logic using `broadcastSessionService`
7. Handle edit mode (load existing session data)
8. Verify TypeScript compilation

**Verification:**
- [ ] Form fields work correctly
- [ ] Slot mappings save correctly
- [ ] Validation prevents duplicate tables
- [ ] Edit mode pre-fills form
- [ ] Save creates/updates session

---

#### Task 2.3: Add routes to AppRouter

**File:** `live-scoring/src/pages/AppRouter.tsx` or `live-scoring/src/App.tsx`

**Steps:**
1. Open AppRouter.tsx or App.tsx
2. Import BroadcastSessionsListPage and BroadcastSessionFormPage
3. Add routes:
   - `/broadcast-sessions` → `<RequireAuth><BroadcastSessionsListPage /></RequireAuth>`
   - `/broadcast-sessions/new` → `<RequireAuth><BroadcastSessionFormPage /></RequireAuth>`
   - `/broadcast-sessions/:id/edit` → `<RequireAuth><BroadcastSessionFormPage /></RequireAuth>`
4. Verify routes work

**Verification:**
- [ ] Routes added correctly
- [ ] RequireAuth wrapper applied
- [ ] Navigation works

---

#### Task 2.4: Implement activeSessions lock and transactional activateSession

**Files:** `live-scoring/src/services/broadcastSessionService.ts`, `firestore.indexes.json` (if needed – none for single-doc read/write by ID)

**Steps:**
1. Introduce top-level collection **activeSessions**. Document ID: `{venueId}_{dateKey}` where `dateKey` is ISO date YYYY-MM-DD. Fields: `venueId`, `dateKey`, `broadcastSessionId`, `updatedAt` (serverTimestamp).
2. Replace the current "query other actives then update" logic in `activateSession(sessionId)` with a **Firestore transaction**:
   - Read `broadcastSessions/{sessionId}` to get `venueId` and `date` (use as dateKey).
   - In the transaction:
     - Set `activeSessions/{venueId}_{dateKey}` to `{ venueId, dateKey, broadcastSessionId: sessionId, updatedAt: serverTimestamp() }`.
     - Set `broadcastSessions/{sessionId}.status` = `"active"`.
     - Optionally read current lock doc in the same transaction; if it had a different `broadcastSessionId`, set `broadcastSessions/{previousId}.status` = `"completed"`.
3. Ensure two concurrent activations for the same venue/date cannot both succeed (transaction enforces single writer).
4. Update `getActiveSessionForVenueAndDate(venueId, date)` to resolve active session via `activeSessions/{venueId}_{dateKey}` (read lock doc, then get `broadcastSessions/{broadcastSessionId}`) for consistency, or keep querying `broadcastSessions` by venueId+date+status for read-only display (activation must still use the lock transaction).

**Verification:**
- [ ] activeSessions lock doc written in same transaction as session status update
- [ ] Only one active session per venue/date under concurrent activation attempts
- [ ] serverTimestamp used for activeSessions.updatedAt

---

#### Task 2.5: Implement venue selection mechanism

**Files to touch:**
- `live-scoring/src/hooks/useVenueSelection.ts` (NEW) - Venue selection hook
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Add venue selector UI

**Steps:**
1. Create `live-scoring/src/hooks/useVenueSelection.ts`
2. Implement hook that:
   - Reads selected venueId from localStorage (key: "selectedVenueId")
   - Provides `venueId: string | null` and `setVenueId(venueId: string)` function
   - Persists venueId to localStorage on change
   - Dispatches custom event "venueSelectionChanged" for cross-tab sync
3. Add venue selector dropdown to LiveScoringManagementPage:
   - Dropdown shows list of venues (can be hardcoded initially or loaded from Firestore)
   - Selected venue stored via `useVenueSelection` hook
   - Default to first venue if none selected
4. Verify venueId persists across page reloads

**Verification:**
- [ ] Hook reads/writes to localStorage
- [ ] Venue selector displays in UI
- [ ] Selected venue persists across reloads
- [ ] Cross-tab sync works via custom event

---

#### Task 2.6: Add session indicator to LiveScoringManagementPage

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Steps:**
1. Open LiveScoringManagementPage.tsx
2. Import `broadcastSessionService` and `slotResolutionService`
3. Add state: `const [activeSession, setActiveSession] = useState<BroadcastSession | null>(null);`
4. Add useEffect to load active session:

```typescript
// Get venueId from user-selected venue (from Task 2.4)
const { venueId } = useVenueSelection();

useEffect(() => {
  if (!venueId) return;
  const today = new Date().toISOString().split("T")[0];
  broadcastSessionService.getActiveSessionForVenueAndDate(venueId, today).then(setActiveSession);
}, [venueId]);
```

5. Add UI component to display session info (if activeSession exists)
6. Add slot badges next to table numbers using `slotResolutionService.getSlotMappings()`
7. Verify no impact on existing match assignment

**Verification:**
- [ ] Active session displays when exists
- [ ] Slot badges show next to tables
- [ ] No impact on match assignment

---

**PR #2 Acceptance Criteria:**
- [ ] Can create broadcast session with venue/date
- [ ] Can map slots (flexible string IDs, examples: A/B/C/D) to physical tables
- [ ] Session activation uses **activeSessions** lock and **transaction** (no query-then-update); only ONE active session per venue/date under concurrency
- [ ] Venue selection mechanism implemented (user selects venue, stored in localStorage; no placeholder venueId)
- [ ] Active session visible in LiveScoringManagementPage (using selected venue)
- [ ] Slot assignments shown in table UI
- [ ] No impact on existing match assignment flow

---

## PR #3: feature/overlay-slots

**Branch:** `feature/overlay-slots`  
**Base:** `feature/broadcast-sessions`  
**Dependencies:** PR #1, PR #2  
**Estimated time:** 1-2 weeks

### Implementation Tasks

#### Task 3.1: Update OverlayTVPage for slot support

**File:** `live-scoring/src/pages/OverlayTVPage.tsx`

**Steps:**
1. Open OverlayTVPage.tsx
2. Import dependencies:

```typescript
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, onSnapshot, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Match } from "../types";
```

3. Update useParams to accept both `table` and `slotId`:

```typescript
const { table: tableParam, slotId } = useParams<{ table?: string; slotId?: string }>();
```

4. Implement sequential fallback strategy (NEVER concurrent listeners). If slotId is used: try slot query; if **first snapshot is empty** (or after a short timeout), **unsubscribe** from slot listener and only then subscribe to legacy **table** listener. Never run both in parallel.

```typescript
useEffect(() => {
  let unsubscribe: (() => void) | null = null;
  
  const loadMatch = async () => {
    // Strategy: Sequential fallback, NOT concurrent listeners
    // Only ONE Firestore listener active at a time
    
    if (slotId) {
      // First attempt: Query by slotId
      const matchesRef = collection(db, "matches");
      const slotQuery = query(
        matchesRef,
        where("slotId", "==", slotId),
        where("status", "==", "inProgress")
      );
      
      // Use getDocs first to check if match exists
      const slotSnapshot = await getDocs(slotQuery);
      
      if (!slotSnapshot.empty) {
        // Found match via slotId - set up listener on the document
        const matchDoc = slotSnapshot.docs[0];
        const matchRef = doc(db, "matches", matchDoc.id);
        unsubscribe = onSnapshot(matchRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setMatch(docSnapshot.data() as Match);
          } else {
            setMatch(null);
          }
        });
        return; // Exit early, listener is set up
      }
      
      // No match found via slotId - fallback to table query (if table param exists)
      if (tableParam) {
        const tableQuery = query(
          matchesRef,
          where("table", "==", parseInt(tableParam)),
          where("status", "==", "inProgress")
        );
        unsubscribe = onSnapshot(tableQuery, (snapshot) => {
          if (!snapshot.empty) {
            setMatch(snapshot.docs[0].data() as Match);
          } else {
            setMatch(null);
          }
        });
      }
    } else if (tableParam) {
      // Route uses table param only - query by table (legacy)
      const matchesRef = collection(db, "matches");
      const tableQuery = query(
        matchesRef,
        where("table", "==", parseInt(tableParam)),
        where("status", "==", "inProgress")
      );
      unsubscribe = onSnapshot(tableQuery, (snapshot) => {
        if (!snapshot.empty) {
          setMatch(snapshot.docs[0].data() as Match);
        } else {
          setMatch(null);
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

5. Verify backward compatibility

**Verification:**
- [ ] `/overlay/tv/1` still works (table route)
- [ ] `/overlay/tv/slot/A` works (slot route)
- [ ] Sequential fallback: slotId query first; if first snapshot empty (or timeout), unsubscribe then switch to table listener only
- [ ] Only ONE listener active at a time (never concurrent)
- [ ] No performance degradation from sequential queries

---

#### Task 3.2: Update all other overlay pages

**Files:**
- `live-scoring/src/pages/LiveOverlayPage.tsx`
- `live-scoring/src/pages/OverlayClassicPage.tsx`
- `live-scoring/src/pages/OverlayModernPage.tsx`
- `live-scoring/src/pages/OverlayMinimalPage.tsx`
- `live-scoring/src/pages/OverlaySportPage.tsx`
- `live-scoring/src/pages/OverlayElegantPage.tsx`
- `live-scoring/src/pages/OverlayHorizontalPage.tsx`
- `live-scoring/src/pages/OverlayDesignsPage.tsx`

**Steps:**
1. Apply same sequential fallback pattern to each overlay page
2. Update useParams to accept slotId
3. Implement sequential fallback logic:
   - If slotId param: try slotId query first, then fallback to table query if no result
   - If table param only: use table query directly
   - NEVER run both queries concurrently
4. Verify each page works

**Verification:**
- [ ] All overlay pages support slot routes
- [ ] All table routes still work

---

#### Task 3.3: Update match assignment to set slotId

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Steps:**
1. Open LiveScoringManagementPage.tsx
2. Locate `startMatch()` function (around line 489)
3. Import `slotResolutionService` and `broadcastSessionService`
4. After setting `table` and `status: "inProgress"`, add:

```typescript
// Resolve slotId if active session exists
try {
  const { venueId } = useVenueSelection(); // From Task 2.4
  if (!venueId) return; // Skip slot resolution if no venue selected
  
  const today = new Date().toISOString().split("T")[0];
  const activeSession = await broadcastSessionService.getActiveSessionForVenueAndDate(venueId, today);
  if (activeSession) {
    const slotId = await slotResolutionService.resolveTableToSlot(table, activeSession.id);
    if (slotId) {
      await updateDoc(matchRef, {
        slotId,
        broadcastSessionId: activeSession.id,
      });
    }
  }
} catch (error) {
  console.error("Error setting slotId:", error);
  // Don't block match assignment if slot resolution fails
}
```

5. Verify match assignment still works without active session
6. Verify slotId is set when session exists

**Verification:**
- [ ] Match assignment sets slotId when session active
- [ ] Match assignment works without session
- [ ] No errors if slot resolution fails

---

#### Task 3.4: Add Firestore indexes for matches queries

**File:** `firestore.indexes.json`

**Steps:**
1. Add indexes needed for overlay queries:
   - `matches` collection - `slotId` + `status` (ASC)
   - `matches` collection - `broadcastSessionId` + `status` (ASC)
2. Deploy indexes: `firebase deploy --only firestore:indexes`

**Verification:**
- [ ] Indexes added and deployed successfully
- [ ] Overlay queries use indexes efficiently

---

#### Task 3.5: Add slot routes to AppRouter

**File:** `live-scoring/src/pages/AppRouter.tsx` or `live-scoring/src/App.tsx`

**Steps:**
1. Add slot-based routes alongside existing table routes:
   - `/overlay/tv/slot/:slotId` → `OverlayTVPage`
   - `/overlay/slot/:slotId` → `LiveOverlayPage`
   - `/overlay/classic/slot/:slotId` → `OverlayClassicPage`
   - (repeat for all overlay variants)
2. Keep all existing `:table` routes unchanged
3. Verify routes work

**Verification:**
- [ ] All slot routes added
- [ ] All table routes still work

---

**PR #3 Acceptance Criteria:**
- [ ] Overlay routes work with both `:table` and `:slotId` parameters
- [ ] Slot-based overlays display correct match
- [ ] Table-based overlays still work (backward compatibility)
- [ ] Sequential fallback strategy: slotId query first, then table query if no result
- [ ] Only ONE Firestore listener active per overlay page (never concurrent)
- [ ] Match assignment adds `slotId` when session active
- [ ] Firestore indexes for matches (slotId + status, broadcastSessionId + status) added in this PR

---

## PR #4: feature/tauri-control-app

**Branch:** `feature/tauri-control-app`  
**Base:** `main` or `develop` (can be parallel)  
**Dependencies:** None (can start in parallel)  
**Estimated time:** 3-4 weeks

### Technical scope (aligned with architecture-decisions.md)

- **No Rust-side Firestore integration:** Do not use firestore-rs, Firebase Admin SDK in Rust, or any Firestore listeners in Rust. All Firestore access stays out of the Rust backend.
- **Firestore in Tauri frontend only:** Command listening and agent heartbeats are implemented in the Tauri **React frontend (TypeScript)** using the **Firebase JS SDK**. The UI subscribes to Firestore (commands, writes heartbeats) and invokes Rust only for OBS/OS actions.
- **Rust responsibilities only:**
  - OBS WebSocket control (connect, scenes, sources, stream start/stop)
  - OS/process control (as needed)
  - Exposed to the frontend via **Tauri commands** (`invoke`). The React app calls these commands when it receives commands from Firestore or when the user acts in the UI.

### Implementation Tasks

#### Task 4.1: Initialize Tauri project

**Directory:** `tauri-control-app/` (NEW)

**Steps:**
1. Run: `npm create tauri-app@latest tauri-control-app`
2. Select React + TypeScript template
3. Configure `tauri.conf.json`:
   - Set `identifier`: `com.sqyping.control`
   - Set `productName`: `SQY Ping Control`
   - Configure permissions: `["network", "filesystem"]`
4. Set up build targets in `tauri.conf.json`
5. Test build: `cd tauri-control-app && npm run tauri build`

**Verification:**
- [ ] Tauri project created
- [ ] Build succeeds

---

#### Task 4.2: Implement OBS WebSocket client (Rust only – no Firestore)

**File:** `tauri-control-app/src/services/obs_client.rs` (NEW)

**Steps:**
1. Add dependency to `Cargo.toml`: `obs-websocket-rs = "0.5"`
2. Create `src/services/obs_client.rs`
3. Implement connection, scene switching, source visibility, stream control
4. Add error handling and reconnection logic
5. Test with OBS Studio

**Verification:**
- [ ] Can connect to OBS
- [ ] Can switch scenes
- [ ] Can control sources
- [ ] Can start/stop stream

---

#### Task 4.3: Create Tauri commands (Rust – OBS/OS only, no Firestore)

**File:** `tauri-control-app/src/commands/obs.rs` (NEW)

**Steps:**
1. Create `src/commands/obs.rs`
2. Implement Tauri command functions for each OBS operation (scene switch, source visibility, stream start/stop, etc.). Rust side must not perform any Firestore reads or writes.
3. Register commands in `main.rs` using `invoke_handler!()`
4. Test from React UI via `invoke()`

**Verification:**
- [ ] Commands registered
- [ ] Can call from UI

---

#### Task 4.4: Implement Firestore command listener (React/TypeScript – Firebase JS SDK only)

**Files:**
- `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (NEW) - Command listener hook
- `tauri-control-app/ui/src/services/firestoreClient.ts` (NEW) - Firestore client wrapper

**Steps:**
1. Install Firebase JS SDK in Tauri UI: `npm install firebase` (no Firestore usage in Rust).
2. Create `ui/src/services/firestoreClient.ts`:
   - Initialize Firebase app with config
   - Export Firestore instance for use by React hooks only
3. Create `ui/src/hooks/useCommandQueue.ts`:
   - Hook accepts `venueId`, `broadcastSessionId`, `slotId` as parameters
   - Sets up Firestore listener in React: `query(commands, where("venueId", "==", venueId), where("broadcastSessionId", "==", sessionId), where("slotId", "==", slotId), where("status", "==", "pending"))`
   - Returns pending commands array
   - Updates command status via Firestore when processing (all from React/TypeScript)
4. Integrate hook in SlotControl component
5. When a command is received, invoke the corresponding Rust Tauri command (e.g. `invoke('obs_switch_scene', { sceneName })`) to perform OBS actions only
6. Update command status in Firestore to "processing" then "completed" or "failed" from the React layer

**Verification:**
- [ ] Firebase JS SDK installed and configured
- [ ] Commands received from Firestore via React hook
- [ ] Commands trigger Rust OBS commands via `invoke()`
- [ ] Command status updates correctly in Firestore

---

#### Task 4.5: Implement command processor (React/TypeScript)

**File:** `tauri-control-app/ui/src/hooks/useCommandQueue.ts` (extend existing hook)

**Steps:**
1. Extend `useCommandQueue` hook from Task 4.4:
   - Add command processing logic
   - Route commands by type
   - Invoke appropriate Rust Tauri command for each command type:
     - `obs_scene_switch` → invoke `obs_switch_scene`
     - `obs_source_visibility` → invoke `obs_set_source_visibility`
     - `obs_stream_start` → invoke `obs_start_stream`
     - `obs_stream_stop` → invoke `obs_stop_stream`
2. Update command status:
   - Set to "processing" when starting
   - Set to "completed" or "failed" when done
3. Add retry logic: 3 retries with exponential backoff for failed commands
4. Test command processing

**Verification:**
- [ ] Commands routed correctly by type
- [ ] OBS actions execute via Rust commands
- [ ] Retry works for failed commands
- [ ] Command status updates correctly

---

#### Task 4.6: Implement heartbeat system (React/TypeScript – Firebase JS SDK only)

**Files:**
- `tauri-control-app/ui/src/hooks/useHeartbeat.ts` (NEW) - Heartbeat sender hook

**Steps:**
1. Create `ui/src/hooks/useHeartbeat.ts` using the Firebase JS SDK (no Rust Firestore). Hook accepts `agentId`, `venueId`, `broadcastSessionId`, `slotId`, `obsStatus`, `obsConnected`, `streaming`, and optional `version`, `os`, `capabilities`.
2. Use `setInterval` to write heartbeat every **10–15 seconds** (e.g. 12s) to Firestore document `agentHeartbeats/{agentId}`. Use **serverTimestamp** for `lastSeen`. Document includes: `agentId`, `venueId`, `broadcastSessionId`, `slotId`, `obsStatus`, `lastSeen` (serverTimestamp), `obsConnected`, `streaming`, `capabilities`, `version`, `os`, `metadata` as needed.
3. **Offline threshold:** 60 seconds – treat agent offline in UI if `lastSeen` is older than 60s.
4. Integrate hook in SlotControl component; cleanup interval on unmount.
5. Test heartbeat updates (all reads/writes via Firebase JS SDK in UI).

**Verification:**
- [ ] Heartbeats sent every 10–15s via React hook; lastSeen is serverTimestamp
- [ ] Heartbeats visible in Firestore; offline threshold 60s used for display
- [ ] Heartbeat stops when component unmounts

---

#### Task 4.7: Create React UI

**Directory:** `tauri-control-app/ui/`

**Steps:**
1. Create components: SlotControl, OBSStatus, CommandQueue
2. Create pages: Dashboard, Settings
3. Create hooks: useOBS, useCommandQueue
4. Style with Material-UI
5. Test UI

**Verification:**
- [ ] UI displays correctly
- [ ] Components work
- [ ] Real-time updates work

---

#### Task 4.8: Add Firestore indexes for commands and agentHeartbeats

**File:** `firestore.indexes.json`

**Steps:**
1. Add indexes needed for Tauri app **React frontend** queries (Firebase JS SDK):
   - `commands` collection - `venueId` + `broadcastSessionId` + `slotId` + `status` + `createdAt` (ASC)
   - `commands` collection - `venueId` + `broadcastSessionId` + `slotId` + `status` (ASC)
   - `agentHeartbeats` collection - `venueId` + `broadcastSessionId` + `slotId` + `lastSeen` (DESC)
   - `agentHeartbeats` collection - `venueId` + `broadcastSessionId` + `slotId` (ASC)
2. Deploy indexes: `firebase deploy --only firestore:indexes`

**Verification:**
- [ ] Indexes added and deployed successfully
- [ ] Command queries use indexes efficiently
- [ ] Heartbeat queries use indexes efficiently

---

#### Task 4.9: Configure build and CI/CD

**Files:**
- `tauri-control-app/tauri.conf.json`
- `tauri-control-app/.github/workflows/build.yml` (NEW)

**Steps:**
1. Configure build for Windows and macOS only
2. Create GitHub Actions workflow (Windows + macOS runners)
3. Test builds
4. Verify artifacts

**Verification:**
- [ ] Builds succeed on Windows and macOS
- [ ] CI/CD works

---

**PR #4 Acceptance Criteria:**
- [ ] Tauri app builds successfully (Windows + macOS)
- [ ] **Rust:** Used only for OBS WebSocket control and OS/process control; no firestore-rs, no Firebase Admin SDK in Rust, no Firestore listeners in Rust
- [ ] **React (Firebase JS SDK):** All Firestore access (command listeners, heartbeat writes) is in the Tauri React frontend (TypeScript) using Firebase JS SDK
- [ ] Can connect to OBS WebSocket via Rust Tauri commands invoked from UI
- [ ] Can control OBS via UI by invoking Rust Tauri commands (e.g. scene switch, source visibility, stream start/stop)
- [ ] Commands are received in the React app via Firestore listener (useCommandQueue) and trigger OBS actions by invoking Rust Tauri commands
- [ ] Heartbeats are written to Firestore from the React app (useHeartbeat) using Firebase JS SDK
- [ ] Firestore indexes for commands and agentHeartbeats deployed and used by React-side queries

---

## PR #5: feature/command-integration

**Branch:** `feature/command-integration`  
**Base:** `feature/overlay-slots`  
**Dependencies:** PR #3, PR #4  
**Estimated time:** 1-2 weeks

### Implementation Tasks

#### Task 5.1: Create CommandService

**File:** `live-scoring/src/services/commandService.ts` (NEW)

**Steps:**
1. Create commandService.ts
2. Implement `createCommand(commandData)` - MUST include `venueId`, `broadcastSessionId`, `slotId`, `type`, `payload`; set `status: "pending"`, `createdAt: serverTimestamp()`. Commands support leasing fields: `processedBy`, `leaseUntil`, `attemptCount`, `lastError`, `completedAt` (serverTimestamp when completed/failed).
3. Implement `getCommandsBySlot(venueId, broadcastSessionId, slotId)` - Query with all three fields
4. Implement `updateCommandStatus(commandId, status)` and helpers for leasing (claim/complete)
5. Use Firestore with proper error handling; use **serverTimestamp** for `createdAt` (and `completedAt` when updating to completed/failed)
6. Test command creation

**Verification:**
- [ ] Commands created with required fields and createdAt serverTimestamp
- [ ] Commands retrieved correctly using venueId + broadcastSessionId + slotId

---

#### Task 5.2: Create commands on match start

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Steps:**
1. Import commandService
2. In `startMatch()`, after setting slotId, create OBS commands:
   - `obs_scene_switch` with sceneName
   - `obs_source_visibility` with sourceName and visible: true
   - `obs_stream_start` (optional)
3. Handle errors gracefully
4. Test command creation

**Verification:**
- [ ] Commands created when match starts (idempotent: set scene/source state, not toggle)
- [ ] Commands have correct slotId
- [ ] No errors if command creation fails

---

#### Task 5.3: Implement command leasing (claim transaction) and idempotent processing

**Files:** `tauri-control-app/ui/src/hooks/useCommandQueue.ts`, command types (leaseUntil, attemptCount, lastError, completedAt)

**Steps:**
1. **Claim command** in a **Firestore transaction**: allowed if `status === "pending"` OR (`status === "processing"` AND `leaseUntil < now`). In the transaction: set `status = "processing"`, `processedBy = agentId`, `leaseUntil = now + 30s` (use serverTimestamp or client + 30s then write), increment `attemptCount`.
2. On success: execute OBS action (idempotent: use set/absolute – e.g. switch to scene X, set source visible true/false – never toggle). On completion: update command with `status = "completed"` or `"failed"`, `completedAt = serverTimestamp()`, `lastError` if failed.
3. Retry strategy: if claim fails (e.g. already claimed), skip or retry later; if lease expires (leaseUntil < now), another agent can re-claim; cap retries by attemptCount if desired.
4. Ensure all OBS actions are **idempotent** (absolute state, not relative/toggle).

**Verification:**
- [ ] Only one agent can process a given command at a time (claim transaction)
- [ ] Expired leases allow re-claim; completedAt and lastError set correctly
- [ ] Commands are processed with set/absolute actions only

---

#### Task 5.4: Create commands on match finish

**File:** `live-scoring/src/components/MatchScoreCard.tsx` or `LiveScoringManagementPage.tsx`

**Steps:**
1. Locate match finish logic
2. Create OBS commands when match finishes:
   - `obs_scene_switch` to "Idle"
   - `obs_source_visibility` with visible: false
   - `obs_stream_stop` (optional)
3. Test command creation

**Verification:**
- [ ] Commands created on match finish
- [ ] Commands have correct slotId

---

#### Task 5.5: Add command status UI

**File:** `live-scoring/src/pages/LiveScoringManagementPage.tsx`

**Steps:**
1. Create `useAgentStatus` hook
2. Add command status display per slot
3. Add agent status display (offline threshold 60s for lastSeen)
4. Add retry button for failed commands
5. Test UI updates

**Verification:**
- [ ] Command status displays correctly
- [ ] Agent status displays correctly
- [ ] Retry works

---

#### Task 5.6: Firestore security rules (admin/operator, venueIds)

**File:** `firestore.rules`

**Steps:**
1. Assume Firebase Auth with custom claims: `role` ("admin" | "operator"), `venueIds` (string[]).
2. **broadcastSessions / activeSessions:** Admin (or authenticated with venue access) can read/write as per product needs; activation via transaction.
3. **commands:** Admin can create (with venueId in venueIds). Operator can read commands where `venueId` in `request.auth.token.venueIds`; operator can update ONLY `status`, `processedBy`, `leaseUntil`, `attemptCount`, `lastError`, `completedAt` – cannot change `venueId`, `broadcastSessionId`, `slotId`, `type`, `payload`.
4. **agentHeartbeats:** Operator can upsert only document where `agentId == request.auth.uid` (or app-defined agentId) and `venueId` in `request.auth.token.venueIds`; admin can read all.
5. Deploy and test in emulator.

**Verification:**
- [ ] Admin can create commands; operator cannot change intent fields
- [ ] Operator can claim and complete commands (update leasing/status only)
- [ ] Operator can write only own heartbeat for allowed venue

---

#### Task 5.7: Firestore emulator tests for rules

**Files:** `firestore.rules`, test script or Jest + @firebase/rules-unit-testing (or equivalent)

**Steps:**
1. Add tests: **admin** can create commands (with venueId in venueIds).
2. Add tests: **operator** cannot change command `venueId`, `broadcastSessionId`, `slotId`, `type`, `payload`; can update `status`, `processedBy`, `leaseUntil`, `attemptCount`, `lastError`, `completedAt`.
3. Add tests: **operator** can claim and complete a command (status/leasing updates only).
4. Add tests: **operator** can write only its own `agentHeartbeats/{agentId}` and only for allowed venue.
5. Run tests in Firestore emulator.

**Verification:**
- [ ] All rule tests pass in emulator
- [ ] Duplicate agent consumption prevented by claim transaction; rules enforce operator limits

---

**PR #5 Acceptance Criteria:**
- [ ] Commands created when match starts (venueId + broadcastSessionId + slotId; createdAt serverTimestamp)
- [ ] Command processing uses **claim transaction** (leaseUntil, attemptCount); idempotent actions only
- [ ] Commands processed by Tauri app (via React Firestore listener); completedAt serverTimestamp
- [ ] Firestore Rules: admin/operator + venueIds; operator can update only leasing/status on commands and upsert own heartbeat
- [ ] Emulator tests for rules: admin create command, operator cannot change intent, operator can claim/complete, operator own heartbeat only
- [ ] OBS scenes switch automatically; agent status visible in admin UI (60s offline threshold)

---

## PR #6: feature/obs-packaging

**Branch:** `feature/obs-packaging`  
**Base:** `main` or `develop` (can be parallel)  
**Dependencies:** None  
**Estimated time:** 1 week

### Implementation Tasks

#### Task 6.1: Create OBS config templates

**Directory:** `obs-portable-configs/` (NEW)

**Steps:**
1. Create directory structure
2. Create config templates for each slot (A/B/C/D)
3. Configure WebSocket ports: 4455, 4456, 4457, 4458
4. Set up browser sources with slot overlay URLs
5. Create scene templates
6. Document configuration

**Verification:**
- [ ] Configs created for all slots
- [ ] WebSocket ports configured correctly
- [ ] Browser sources point to correct URLs

---

#### Task 6.2: Create Windows OBS package

**Directory:** `obs-portable-configs/windows/`

**Steps:**
1. Download OBS Studio portable for Windows
2. Create batch scripts: `start-obs-slot-a.bat`, `start-obs-slot-b.bat`, `start-obs-slot-c.bat`, `start-obs-slot-d.bat`
3. Configure scripts to use slot-specific config directories
4. Package as `obs-portable-windows.zip`
5. Test on clean Windows machine
6. Create README

**Verification:**
- [ ] Windows package created
- [ ] Scripts work correctly
- [ ] Can run 4 instances simultaneously

---

#### Task 6.3: Create macOS OBS package

**Directory:** `obs-portable-configs/macos/`

**Steps:**
1. Download OBS Studio for macOS
2. Create shell scripts: `start-obs-slot-a.sh`, `start-obs-slot-b.sh`, `start-obs-slot-c.sh`, `start-obs-slot-d.sh`
3. Configure scripts to use slot-specific config directories
4. Package as `obs-portable-macos.tar.gz`
5. Test on clean macOS machine
6. Create README

**Verification:**
- [ ] macOS package created
- [ ] Scripts work correctly
- [ ] Can run 4 instances simultaneously

---

#### Task 6.4: Create OBS setup documentation

**File:** `docs/obs-setup.md` (NEW)

**Steps:**
1. Create documentation file
2. Document installation for Windows and macOS only
3. Document configuration steps per platform
4. Document troubleshooting
5. Test following instructions

**Verification:**
- [ ] Documentation complete
- [ ] Instructions work for Windows and macOS

---

**PR #6 Acceptance Criteria:**
- [ ] OBS packages available for Windows and macOS
- [ ] Can start 4 OBS instances simultaneously
- [ ] Each instance uses correct WebSocket port
- [ ] Browser sources point to correct overlay URLs
- [ ] Documentation complete

---

## Cross-Cutting Tasks

### Firestore Rules Update

**File:** `firestore.rules`

**Steps:**
1. Add rules for broadcastSessions, commands, agentHeartbeats
2. Test in emulator
3. Deploy rules

**Verification:**
- [ ] Rules secure
- [ ] Rules tested
- [ ] Rules deployed

---

### Documentation Updates

**Files:**
- `README.md`
- `docs/ARCHITECTURE.md` (NEW)
- `docs/DEPLOYMENT.md` (NEW)
- `docs/API.md` (NEW)
- `docs/TROUBLESHOOTING.md` (NEW)

**Steps:**
1. Update/create documentation files
2. Document slot system
3. Document Tauri app
4. Document commands API
5. Add troubleshooting guide

**Verification:**
- [ ] Documentation complete
- [ ] Documentation accurate

---

## Notes

- **No changes to live-scoring-sqyparatt**: All tasks explicitly exclude this directory
- **Backward compatibility**: All overlay routes with `:table` parameter must continue working
- **Physical tables remain central**: Admin pages continue to use physical table numbers, slots are for streaming only
- **Top-level collections**: Commands and agentHeartbeats are top-level Firestore collections, scoped via broadcastSessionId + venueId + slotId
