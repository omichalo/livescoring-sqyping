/**
 * Types pour les matchs Firestore compatibles avec le composant MatchScoreCard
 * du projet livescoring-sqyping
 */

export type ScoreSet = { player1: number; player2: number };

/**
 * Membre d'un match en double
 */
export interface DoubleMember {
  name: string;
  country: string;
}

export interface Player {
  id: string;
  name: string; // Desc du participant (pour les doubles, c'est la description de l'équipe)
  teamId: string;
  encounterId: string;
  order?: number;
  // Membres en cas de match en double
  members?: DoubleMember[];
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
  player1: Player;
  player2: Player;
  score: ScoreSet[];
  setsWon: { player1: number; player2: number };
  matchNumber: number;
  type?: "single" | "double";
  status: "waiting" | "inProgress" | "finished" | "cancelled";
  startTime: number;
  encounterId?: string;
  order?: number;
  ittfHasComps?: boolean; // Indique si le match avait des compositions détaillées au chargement
  ittfLastUpdate?: number; // Timestamp de la dernière mise à jour depuis l'API ITTF
}
