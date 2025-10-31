/**
 * Utilitaires pour mapper les matchs ITTF vers le format Firestore
 */

import type { Match } from "./ittf/types";
import type { FirestoreMatch, Player } from "@/types/firestore-match";

/**
 * Extrait le numéro de table depuis le code de localisation ITTF
 * @param loc Code de localisation (ex: "T11", "T1", "Table 5")
 * @returns Numéro de table ou null si extraction impossible
 */
export function extractTableNumber(loc: string): number | null {
  if (!loc) return null;

  // Pattern pour extraire le numéro après T
  const match = loc.match(/T(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  // Pattern pour extraire le numéro dans "Table X"
  const tableMatch = loc.match(/Table\s+(\d+)/i);
  if (tableMatch && tableMatch[1]) {
    return parseInt(tableMatch[1], 10);
  }

  // Essayer de parser directement si c'est juste un nombre
  const num = parseInt(loc, 10);
  if (!isNaN(num)) {
    return num;
  }

  return null;
}

/**
 * Mappe un match ITTF vers le format Firestore attendu par MatchScoreCard
 * @param ittfMatch Match au format ITTF
 * @param tableOverride Numéro de table à utiliser (optionnel, sinon extrait de match.table)
 * @returns Match au format Firestore (partiel, à compléter avant sauvegarde)
 */
export function mapITTFMatchToFirestore(
  ittfMatch: Match,
  tableOverride?: number
): Partial<FirestoreMatch> {
  const tableNumber =
    tableOverride ?? extractTableNumber(ittfMatch.table) ?? undefined;

  // Utiliser le Desc comme nom principal (description de l'équipe)
  const player1Name = ittfMatch.team1.names[0] || "Joueur 1";
  const player2Name = ittfMatch.team2.names[0] || "Joueur 2";

  // Pour le pays, prendre le premier pays
  const player1Country = ittfMatch.team1.countries[0] || "TEAM1";
  const player2Country = ittfMatch.team2.countries[0] || "TEAM2";

  // Créer des Players minimaux (IDs temporaires)
  const player1: Player = {
    id: `temp-${ittfMatch.matchId}-p1`,
    name: player1Name,
    teamId: player1Country,
    encounterId: "ittf-match",
    order: 1,
    // Stocker les membres si présents (doubles)
    members: ittfMatch.team1.members,
  };

  const player2: Player = {
    id: `temp-${ittfMatch.matchId}-p2`,
    name: player2Name,
    teamId: player2Country,
    encounterId: "ittf-match",
    order: 2,
    // Stocker les membres si présents (doubles)
    members: ittfMatch.team2.members,
  };

  // Mapper les scores des games
  const score =
    ittfMatch.team1.games && ittfMatch.team2.games
      ? ittfMatch.team1.games.map((p1Score, index) => ({
          player1: p1Score,
          player2: ittfMatch.team2.games![index] || 0,
        }))
      : [];

  // Calculer les sets gagnés
  const setsWon = {
    player1: ittfMatch.team1.score ?? 0,
    player2: ittfMatch.team2.score ?? 0,
  };

  // Déterminer le statut
  let status: FirestoreMatch["status"] = "waiting";
  if (ittfMatch.status === 1) {
    status = "finished";
  } else if (ittfMatch.status === 2) {
    status = "inProgress";
  } else if (ittfMatch.status === 4) {
    status = "waiting";
  }

  // Déterminer si c'est un match de double (présence de Members)
  const isDouble =
    (ittfMatch.team1.members && ittfMatch.team1.members.length > 0) ||
    (ittfMatch.team2.members && ittfMatch.team2.members.length > 0);

  return {
    player1,
    player2,
    score,
    setsWon,
    table: tableNumber,
    matchNumber: 0, // À définir lors de la création
    type: isDouble ? "double" : "single",
    status,
    startTime: Date.now(),
    ittfHasComps: ittfMatch.hasComps || false, // Conserver l'état de la composition
    ittfLastUpdate: Date.now(), // Timestamp de la création/mise à jour
  };
}

/**
 * Génère un ID Firestore basé sur l'ID du match ITTF
 */
export function generateFirestoreMatchId(ittfMatchKey: string): string {
  // Remplacer les caractères non-alphanumériques par des underscores
  return `ittf_${ittfMatchKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
}
