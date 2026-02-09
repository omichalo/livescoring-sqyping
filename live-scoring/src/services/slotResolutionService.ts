import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { BroadcastSession, SlotMapping } from "../types/broadcast";

/**
 * SlotResolutionService resolves slot↔table mappings given a sessionId.
 * It does NOT retrieve active sessions. Use BroadcastSessionService.getActiveSessionForVenueAndDate() for that.
 */

export async function resolveSlotToTable(
  slotId: string,
  sessionId: string
): Promise<number | null> {
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return null;
    const session = sessionDoc.data() as BroadcastSession;
    const mapping = session.slotMappings.find(
      (m) => m.slotId === slotId && m.isActive
    );
    return mapping?.physicalTable ?? null;
  } catch (error) {
    console.error("Error resolving slot to table:", error);
    return null;
  }
}

export async function resolveTableToSlot(
  table: number,
  sessionId: string
): Promise<string | null> {
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return null;
    const session = sessionDoc.data() as BroadcastSession;
    const mapping = session.slotMappings.find(
      (m) => m.physicalTable === table && m.isActive
    );
    return mapping?.slotId ?? null;
  } catch (error) {
    console.error("Error resolving table to slot:", error);
    return null;
  }
}

export async function getSlotMappings(
  sessionId: string
): Promise<SlotMapping[]> {
  try {
    const sessionRef = doc(db, "broadcastSessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return [];
    const session = sessionDoc.data() as BroadcastSession;
    return session.slotMappings.filter((m) => m.isActive);
  } catch (error) {
    console.error("Error getting slot mappings:", error);
    return [];
  }
}
