export type ScoreSet = { player1: number; player2: number };

export interface Team {
  id: string;
  name: string;
  matchesWon: number;
  order?: number; // Pour contrôler l'ordre d'affichage
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  encounterId: string; // Référence à la rencontre
  order?: number; // Pour contrôler l'ordre d'affichage (A, B, C, D et W, X, Y, Z)
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  score: { player1: number; player2: number }[];
  setsWon: { player1: number; player2: number };
  table?: number;
  matchNumber: number;
  status: "waiting" | "inProgress" | "finished" | "cancelled";
  startTime: number; // ⬅️ important
  encounterId?: string; // Référence à la rencontre
  order?: number; // Pour contrôler l'ordre d'affichage des matchs
}

export interface Encounter {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "archived";
  team1Id: string;
  team2Id: string;
  numberOfTables: number; // Nombre de tables disponibles
  createdAt: number;
  updatedAt: number;
  isCurrent?: boolean; // Marque la rencontre en cours
}

export function createMatch(
  params: Omit<Match, "status"> & Partial<Pick<Match, "status">>
): Match {
  return {
    ...params,
    status: params.status ?? "waiting", // Valeur par défaut ici
  };
}
