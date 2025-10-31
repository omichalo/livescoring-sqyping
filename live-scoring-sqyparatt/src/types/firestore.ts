/**
 * Types pour le système de live scoring basé sur Firestore
 * Basés sur les types existants du projet livescoring-sqyping
 */

export type ScoreSet = { player1: number; player2: number };

export interface FirestorePlayer {
  id: string;
  name: string;
  teamId: string;
  encounterId: string; // Référence à la rencontre
  order?: number; // Pour contrôler l'ordre d'affichage (A, B, C, D et W, X, Y, Z)
}

export interface FirestoreMatch {
  id?: string; // Firestore document ID
  ittfMatchId: string; // Reference to the ITTF API match ID
  championshipId: string;
  date: string;
  table: number;
  eventKey: string;
  matchDesc: string;
  scheduledTime: string;
  player1: FirestorePlayer;
  player2: FirestorePlayer;
  score: {
    player1: number;
    player2: number;
    sets: ScoreSet[];
  };
  setsWon: { player1: number; player2: number };
  status: "waiting" | "inProgress" | "finished" | "cancelled";
  startTime: number; // Unix timestamp
  encounterId?: string;
  order?: number;
  matchNumber?: number;
  type?: "single" | "double";
}

export interface FirestoreEncounter {
  id?: string; // Firestore document ID
  championshipId: string;
  date: string; // Date de l'encounter (YYYY-MM-DD)
  name: string; // Nom de l'encounter (ex: "Jour 1", "Jour 2")
  description?: string;
  status: "active" | "completed" | "archived";
  numberOfTables: number; // Nombre de tables disponibles
  createdAt: number;
  updatedAt: number;
  isCurrent?: boolean; // Marque l'encounter en cours
}

export interface EncounterSummary {
  encounter: FirestoreEncounter;
  totalMatches: number;
  completedMatches: number;
  inProgressMatches: number;
  waitingMatches: number;
}


