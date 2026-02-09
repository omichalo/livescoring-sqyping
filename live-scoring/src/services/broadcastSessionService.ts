import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import type { BroadcastSession } from "../types/broadcast";

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

export async function getSession(
  sessionId: string
): Promise<BroadcastSession | null> {
  const sessionRef = doc(db, "broadcastSessions", sessionId);
  const sessionDoc = await getDoc(sessionRef);
  if (!sessionDoc.exists()) return null;
  return { id: sessionDoc.id, ...sessionDoc.data() } as BroadcastSession;
}

/**
 * Get active broadcast session for a venue and date.
 * Query MUST filter by venueId + date + status to enforce concurrency rule.
 */
export async function getActiveSessionForVenueAndDate(
  venueId: string,
  dateKey: string
): Promise<BroadcastSession | null> {
  const sessionsRef = collection(db, "broadcastSessions");
  const q = query(
    sessionsRef,
    where("venueId", "==", venueId),
    where("date", "==", dateKey),
    where("status", "==", "active")
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  // Should return at most one document (enforced by activateSession)
  if (snapshot.size > 1) {
    console.warn(
      "Multiple active sessions found for venue/date - data inconsistency"
    );
  }
  const firstDoc = snapshot.docs[0];
  return { id: firstDoc.id, ...firstDoc.data() } as BroadcastSession;
}

/**
 * Activate a broadcast session.
 * Enforces multi-venue concurrency rule: Only ONE active session per venue per date.
 * MUST deactivate any other active session for the same venueId AND date.
 */
export async function activateSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const sessionsRef = collection(db, "broadcastSessions");
  const otherActiveQuery = query(
    sessionsRef,
    where("venueId", "==", session.venueId),
    where("date", "==", session.date),
    where("status", "==", "active")
  );
  const otherActiveSnapshot = await getDocs(otherActiveQuery);

  const deactivationPromises = otherActiveSnapshot.docs
    .filter((d) => d.id !== sessionId)
    .map((d) =>
      updateDoc(d.ref, { status: "completed", updatedAt: Date.now() })
    );

  await Promise.all(deactivationPromises);

  await updateSession(sessionId, { status: "active" });
}

export async function deactivateSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  const newStatus =
    session.status === "active" ? "completed" : "scheduled";
  await updateSession(sessionId, { status: newStatus });
}
