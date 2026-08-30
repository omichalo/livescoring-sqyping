/**
 * Types correspondant à la structure exacte de l'API ITTF
 * Ces types reflètent les données brutes telles qu'elles sont retournées par l'API
 */

import type { MatchStatus } from "./types";

/**
 * Structure d'un split (set/game) dans un match
 */
export interface RawSplit {
  /** Indique si ce split a été gagné */
  Win: boolean;

  /** Résultat (score) du split */
  Res: string;
}

/**
 * Structure d'un membre dans un double
 */
export interface RawMember {
  /** Nom du joueur */
  Desc: string;

  /** Code de l'organisation (pays) - ISO 3166-1 alpha-3 */
  Org: string;
}

/**
 * Structure d'un participant (joueur ou équipe) dans l'API brute
 */
export interface RawParticipant {
  /** Numéro d'enregistrement du joueur */
  Reg: string;

  /** Code de l'organisation (pays) - ISO 3166-1 alpha-3 */
  Org: string;

  /** Description de l'organisation (nom du pays) */
  OrgDesc: string;

  /** Nom du joueur ou de l'équipe */
  Desc: string;

  /** Résultat (nombre de sets gagnés) */
  Res: string;

  /** Indique si le participant a gagné le match */
  Win: boolean;

  /** Position au classement */
  RkPo: number;

  /** Détail des scores par set */
  Splits: RawSplit[];

  /** Liste des membres en cas de double (si présent) */
  Members?: RawMember[];
}

/**
 * Structure d'un match retourné par l'API ITTF
 */
export interface RawMatch {
  /** Clé unique du match (ex: W.SINGLES----WS7----.GP04.000400--) */
  Key: string;

  /** Description du match */
  Desc: string;

  /** Heure formatée (ex: "Wed 15, 10:00") */
  Time: string;

  /** Code de la table (ex: "T11") */
  Loc: string;

  /** Description de la table (ex: "Table 11") */
  LocDesc: string;

  /** Lieu/salle où se déroule le match */
  Venue: string;

  /** Heure brute (ex: "10:00") */
  RTime: string;

  /** Statut du match (1: Finished, 2: Live, 4: Upcoming, 6: Live & Upcoming) */
  Status: MatchStatus;

  /** Indique si c'est un match par équipes */
  IsTeam: boolean;

  /** Indique si le match a des compositions détaillées */
  HasComps: boolean;

  /** Participant domicile (ou joueur 1) */
  Home: RawParticipant;

  /** Participant extérieur (ou joueur 2) */
  Away: RawParticipant;

  /** Indique si le match a des statistiques */
  HasStats: boolean;
}

/**
 * Réponse brute de l'API ITTF pour les matchs d'une journée
 * L'API retourne un objet avec des clés numériques (index), pas un array
 */
export type RawMatchDayResponse = Record<string, RawMatch>;
