# Multi-Agent Streaming System - Implementation Plan

## Overview

This plan documents the evolution of the live scoring system to support:
- Stable streaming slots (A/B/C/D) independent of physical table numbers
- Multi-instance OBS control via Tauri desktop app
- Broadcast session management (venue/day mapping)
- Future YouTube API automation
- Zero regression in existing scoring UX

## Documents

1. **[Current State Map](./current-state-map.md)** - Analysis of existing codebase
   - Overlay routes and implementations
   - Admin score management pages
   - Firestore collections and queries
   - Table field usage patterns
   - Risk areas identification

2. **[Target Architecture](./target-architecture.md)** - Design of new system
   - Domain model (slots, sessions, mappings)
   - Firestore schema additions
   - Web app evolution strategy
   - Tauri control app architecture
   - OBS packaging layout
   - Data flow diagrams

3. **[Execution Checklist](./execution-checklist.md)** - Step-by-step implementation
   - Branch strategy
   - Phased implementation plan
   - Acceptance criteria per phase
   - Regression risk assessment
   - Rollback procedures
   - Testing strategy

## Key Principles

1. **Physical tables remain central** - Admin UX continues to use table numbers
2. **Slots are abstraction layer** - Behind-the-scenes mapping, not replacement
3. **Backward compatibility** - Existing functionality preserved
4. **Additive changes** - New fields optional, existing queries unchanged
5. **Gradual migration** - Can deploy incrementally

## Architecture Summary

```
Physical Table (admin UX)
    ↓
Broadcast Session (venue + date)
    ↓
Slot Mapping (A/B/C/D → table)
    ↓
Streaming Slot (OBS instance)
```

**Match Document Evolution:**
- Keep: `table?: number` (physical table)
- Add: `slotId?: string` (streaming slot)
- Add: `broadcastSessionId?: string` (session context)

**New Firestore Collections:**
- `broadcastSessions` - Venue/day sessions with slot mappings
- `commands` - OBS control commands queue
- `agentHeartbeats` - Tauri app status monitoring

## Implementation Phases

### Phase 1: Infrastructure Foundation
- Add Firestore schema extensions
- Create slot resolution service
- Create broadcast session service
- **Risk: LOW** - Only adding optional fields

### Phase 2: Broadcast Session Management UI
- Create session management pages
- Add slot mapping UI
- Integrate with admin pages
- **Risk: LOW** - New pages only

### Phase 3: Slot-Based Overlay Support
- Update overlay routes to support slots
- Update match assignment to set slotId
- Optimize queries
- **Risk: MEDIUM** - Changes to overlay queries

### Phase 4: Tauri Control App
- Build Tauri desktop app
- Implement OBS WebSocket client
- Implement Firestore command listener
- **Risk: NONE** - New application

### Phase 5: Command Integration
- Create command service
- Integrate command creation with match flow
- Add agent status monitoring
- **Risk: LOW** - Additive changes

### Phase 6: OBS Portable Packaging
- Create OBS configs per slot
- Package for Windows/macOS/Linux
- Document setup procedures
- **Risk: NONE** - Separate packaging

## Critical Design Decisions

1. **Dual-write pattern**: Write both `table` and `slotId` to matches
2. **Optional fields**: `slotId` and `broadcastSessionId` are optional
3. **URL compatibility**: Keep `:table` routes, add `:slotId` routes
4. **Command queue**: Firestore-based for resilience
5. **Heartbeat system**: Monitor agent health

## Migration Path

1. Deploy infrastructure (Phase 1) - No breaking changes
2. Enable session management (Phase 2) - Optional feature
3. Enable slot overlays (Phase 3) - Backward compatible
4. Deploy Tauri app (Phase 4) - Parallel deployment
5. Enable automation (Phase 5) - Gradual rollout
6. Distribute OBS packages (Phase 6) - Separate distribution

## Testing Strategy

- **Unit tests**: Services and utilities
- **Integration tests**: End-to-end flows
- **Manual tests**: All platforms, all scenarios
- **Performance tests**: Query optimization, command latency

## Success Criteria

- ✅ Physical tables remain visible in admin UX
- ✅ Slots work independently of tables
- ✅ Multiple venues can operate in parallel
- ✅ OBS scenes switch automatically
- ✅ Zero regression in scoring functionality
- ✅ Tauri app controls OBS reliably
- ✅ Commands process within 1 second

## Next Steps

1. Review all three documents
2. Confirm architecture decisions
3. Start Phase 1 implementation
4. Set up development environment for Tauri
5. Create feature branches per phase

## Questions to Resolve

1. **Authentication**: How will Tauri app authenticate with Firestore?
   - Option A: Service account key (secure, requires key management)
   - Option B: User OAuth flow (more complex, better UX)
   - Recommendation: Start with service account, migrate to OAuth later

2. **Slot Limits**: Should we support more than 4 slots?
   - Current design: Fixed A/B/C/D
   - Alternative: Dynamic slots array
   - Recommendation: Start with 4, make configurable later

3. **Session Overlap**: What if sessions overlap (same venue, different days)?
   - Current design: One active session per date
   - Alternative: Multiple concurrent sessions
   - Recommendation: One active session per date (simpler)

4. **Command Retry**: How many retries for failed commands?
   - Recommendation: 3 retries with exponential backoff

5. **Heartbeat Frequency**: How often should agents send heartbeats?
   - Recommendation: Every 5 seconds, consider stale after 30 seconds

## Contact & Updates

This plan is a living document. Update as implementation progresses and new insights emerge.
