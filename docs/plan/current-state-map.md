# Current State Map

## Repository Structure

The repository contains two main React applications:

1. **`live-scoring/`** - Main admin/scoring application (Vite + React)
2. **`live-scoring-sqyparatt/`** - Secondary application (Next.js) with ITTF integration

Both share the same Firestore database but have different UI implementations.

## Firestore Collections

### Core Collections

- **`matches`** - Match documents with structure:
  ```typescript
  {
    id: string;
    player1: Player;
    player2: Player;
    score: { player1: number; player2: number }[];
    setsWon: { player1: number; player2: number };
    table?: number;  // ⚠️ CRITICAL: Numeric table field
    matchNumber: number;
    type?: "single" | "double";
    status: "waiting" | "inProgress" | "finished" | "cancelled";
    startTime: number;
    encounterId?: string;
    order?: number;
  }
  ```

- **`encounters`** - Encounter/meeting documents:
  ```typescript
  {
    id: string;
    name: string;
    status: "active" | "completed" | "archived";
    team1Id: string;
    team2Id: string;
    numberOfTables: number;  // Physical tables count
    createdAt: number;
    updatedAt: number;
  }
  ```

- **`teams`** - Team documents
- **`players`** - Player documents (linked to encounters)

### Firestore Indexes

Current indexes in `firestore.indexes.json`:
- `matches`: `status` + `matchNumber` (ASC)
- `matches`: `encounterId` + `matchNumber` (ASC)

**Missing indexes**: No composite index for `table` + `status` queries (may cause performance issues).

## Overlay Routes

### live-scoring App (`live-scoring/src/App.tsx`)

All overlay routes use `:table` as URL parameter:

- `/overlay/tv/:table` → `OverlayTVPage`
- `/overlay/:table` → `LiveOverlayPage`
- `/overlay/classic/:table` → `OverlayClassicPage`
- `/overlay/modern/:table` → `OverlayModernPage`
- `/overlay/minimal/:table` → `OverlayMinimalPage`
- `/overlay/sport/:table` → `OverlaySportPage`
- `/overlay/elegant/:table` → `OverlayElegantPage`
- `/overlay/horizontal/:design/:table` → `OverlayHorizontalPage`
- `/overlay/designs/:design/:table` → `OverlayDesignsPage`
- `/overlay/score/:table` → `ScoreOverlay`

### live-scoring-sqyparatt App (`live-scoring-sqyparatt/src/App.tsx`)

- `/overlay/tv/:tableNumber` → `OverlayTVPage`

## Overlay Implementation Details

### OverlayTVPage (`live-scoring/src/pages/OverlayTVPage.tsx`)

**Query Pattern:**
```typescript
// Lines 21-25: Query by encounterId + status, then filter by table
const matchesQuery = query(
  collection(db, "matches"),
  where("encounterId", "==", currentEncounter.id),
  where("status", "==", "inProgress")
);
// Line 34: Client-side filter
const tableMatch = matches.find((m) => m.table === parseInt(table));
```

**Dependencies:**
- Requires `currentEncounter` from `useCurrentEncounter()` hook
- Uses localStorage-based encounter selection (recently implemented)
- Fetches teams separately via `doc()` queries

### LiveOverlayPage (`live-scoring/src/pages/LiveOverlayPage.tsx`)

**Query Pattern:**
```typescript
// Lines 16-20: Direct query by table number
query(
  collection(db, "matches"),
  where("table", "==", Number(table)),
  where("status", "==", "inProgress")
)
```

**Dependencies:**
- Direct table-based query (no encounter filtering)
- Simpler but less scoped (may show matches from wrong encounter)

## Admin Score Management Pages

### LiveScoringManagementPage (`live-scoring/src/pages/LiveScoringManagementPage.tsx`)

**Key Features:**
- Displays matches grouped by status (waiting, inProgress, finished)
- Table assignment UI: buttons to assign waiting matches to physical tables
- Drag-and-drop table reordering (saved in localStorage per encounter)
- Table visibility configuration (show/hide tables)
- Match scoring via `MatchScoreCard` component

**Table Management:**
- `availableTables`: Array of table numbers from `encounter.numberOfTables`
- `visibleTables`: Filtered subset (localStorage per encounter)
- Table order persisted: `tableOrder_${encounterId}` in localStorage

**Match Assignment Flow:**
```typescript
// Lines 489-501: startMatch function
await updateDoc(matchRef, {
  status: "inProgress",
  table: tableNumber,  // Direct assignment
  startTime: Date.now(),
});
```

**Query Patterns:**
- Lines 333-337: `where("encounterId", "==", currentEncounter.id)` + `orderBy("matchNumber")`
- Lines 414-417: Filter inProgress matches by `table` field
- Lines 696-705: Filter and sort by visible tables

### EncounterPreparationPage (`live-scoring/src/pages/EncounterPreparationPage.tsx`)

- Creates players and matches for an encounter
- Generates match schedules (14-match format, custom formats)
- No table assignment at creation time (tables assigned later in LiveScoringManagementPage)

## Match Status Lifecycle

1. **Creation**: `status: "waiting"`, no `table` assigned
2. **Start**: Admin assigns `table` number, sets `status: "inProgress"`, sets `startTime`
3. **Scoring**: Updates via `MatchScoreCard` component (score arrays, setsWon)
4. **Finish**: `status: "finished"` (triggered when setsWon reaches 3)
5. **Cancellation**: `status: "cancelled"` (when encounter completes early)

**Completion Logic** (`encounterService.ts`):
- Checks finished matches for encounter
- Counts victories per team
- Marks encounter as "completed" at 8 victories
- Cancels remaining waiting matches

## Table Field Usage Analysis

### Direct Queries (High Risk)

**Files using `where("table", "==", ...)`:**

1. `live-scoring/src/pages/LiveOverlayPage.tsx:18`
   - Query: `where("table", "==", Number(table))`
   - Impact: Overlay won't work without table number

2. `live-scoring-sqyparatt/src/services/liveScoringService.ts:85`
   - `getMatchesByTable(table: number)` - Direct table query
   - Used by: `useLiveScoringMatches` hook

3. `live-scoring-sqyparatt/src/services/liveScoringService.ts:219`
   - `listenToTableMatches(table, date, encounterId)` - Table + encounterId query
   - Used by: Live scoring components

### Client-Side Filtering (Medium Risk)

**Files filtering by `match.table`:**

1. `live-scoring/src/pages/OverlayTVPage.tsx:34`
   - After querying by encounterId, filters: `matches.find((m) => m.table === parseInt(table))`
   - Impact: Will break if table field changes structure

2. `live-scoring/src/pages/LiveScoringManagementPage.tsx:414-417`
   - `getUsedTables()` filters: `matches.filter((m) => m.status === "inProgress" && m.table)`
   - Impact: Table assignment UI depends on this

3. `live-scoring/src/components/LiveScoringPanel.tsx:17`
   - Sorts by: `(a.table || 199) - (b.table || 99)`
   - Impact: Display ordering breaks

### Display/UI (Low Risk - Easy to Update)

- Table badges/chips showing table numbers
- Table selection buttons
- Table visibility toggles
- URL parameters (`:table` in routes)

## Risk Areas

### Critical Coupling Points

1. **Overlay Routes** - All use `:table` URL parameter
   - Risk: Changing URL structure breaks OBS browser sources
   - Mitigation: Keep URL structure, add slot resolution layer

2. **Firestore Queries** - Direct `where("table", "==", ...)` queries
   - Risk: Cannot query by slot without table
   - Mitigation: Add adapter layer or dual-write pattern

3. **Match Assignment** - Direct `table` field assignment
   - Risk: Admin UX expects physical table numbers
   - Mitigation: Keep table field, add slotId separately

4. **Encounter.numberOfTables** - Used to generate table lists
   - Risk: Admin expects physical table count
   - Mitigation: Keep as-is, slots are separate concern

### Medium Risk Areas

1. **localStorage Table Preferences** - Per-encounter table order/visibility
   - Risk: Slot mapping changes don't affect localStorage
   - Mitigation: Clear localStorage on slot mapping changes or version localStorage keys

2. **Match Sorting** - Multiple places sort by `table` number
   - Risk: Display order may not match slot order
   - Mitigation: Add slot-aware sorting utilities

3. **Table Filtering** - Client-side filtering by `table` field
   - Risk: Performance if many matches
   - Mitigation: Move filtering to Firestore queries with proper indexes

### Low Risk Areas

1. **Display Components** - Show table numbers in UI
   - Risk: Visual only, easy to update
   - Mitigation: Add slot display alongside table

2. **TypeScript Types** - `Match.table?: number`
   - Risk: Type safety
   - Mitigation: Add `slotId?: string` field, keep `table`

## Query Patterns Summary

### By Table Number
- `where("table", "==", tableNumber)` - Direct queries
- Client-side filtering: `matches.filter(m => m.table === tableNumber)`

### By Encounter + Status
- `where("encounterId", "==", encounterId)` + `where("status", "==", status)`
- Then client-side filter by table

### By Status Only
- `where("status", "==", "waiting")` - Used for upcoming matches
- No table filtering (shows all waiting matches)

## Missing Firestore Indexes

Current indexes don't support common query patterns:

**Needed indexes:**
- `matches`: `table` + `status` (for overlay queries)
- `matches`: `encounterId` + `table` + `status` (for scoped table queries)
- `matches`: `encounterId` + `status` + `matchNumber` (already exists)

## Admin UX Flow

1. **Encounter Creation** (`EncounterFormPage`)
   - Set `numberOfTables` (physical tables)
   - Creates teams

2. **Player Preparation** (`EncounterPreparationPage`)
   - Add players per team
   - Generate match schedule
   - Matches created with `status: "waiting"`, no `table`

3. **Match Management** (`LiveScoringManagementPage`)
   - View waiting matches
   - Assign to physical table (sets `table` field)
   - Start match (sets `status: "inProgress"`)
   - Score via `MatchScoreCard`
   - Finish match (sets `status: "finished"`)

4. **Overlay Display** (Various overlay pages)
   - Read match by table number
   - Display score overlay

## Key Insights

1. **Table is Central**: Physical table numbers are deeply embedded in admin UX
2. **No Slot Concept**: Currently no abstraction between physical table and streaming slot
3. **Encounter Scoping**: Some queries scope by encounter, others don't (inconsistency)
4. **localStorage Usage**: Table preferences stored per-encounter in localStorage
5. **Dual App Structure**: Two apps share Firestore but have different query patterns

## Files Requiring Changes

### High Priority (Core Functionality)
- `live-scoring/src/pages/OverlayTVPage.tsx` - Overlay query logic
- `live-scoring/src/pages/LiveOverlayPage.tsx` - Overlay query logic
- `live-scoring/src/pages/LiveScoringManagementPage.tsx` - Table assignment
- `live-scoring-sqyparatt/src/services/liveScoringService.ts` - Service queries
- `live-scoring/src/types.ts` - Type definitions
- `live-scoring-sqyparatt/src/types/firestore-match.ts` - Type definitions

### Medium Priority (Supporting Code)
- `live-scoring/src/components/LiveScoringPanel.tsx` - Table sorting
- `live-scoring/src/pages/EncounterFormPage.tsx` - numberOfTables field
- All overlay page components (route parameters)

### Low Priority (Display Only)
- Various display components showing table numbers
- URL route definitions (keep structure, add resolution)
