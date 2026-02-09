/**
 * Utilitaires pour parser et manipuler les données ITTF
 */

import type {
  ChampionshipId,
  EventType,
  EventFormat,
  ParsedEventKey,
  ParsedPhaseKey,
  MatchStatus,
} from "./types";

// ============================================================================
// URL Builders
// ============================================================================

const ITTF_BASE_URL =
  process.env.NEXT_PUBLIC_ITTF_API_BASE_URL ||
  "https://results.ittf.com/ittf-web-results/html";

/**
 * Construit l'URL pour récupérer les données d'un championnat
 */
export function buildChampionshipUrl(champId: ChampionshipId): string {
  return `${ITTF_BASE_URL}/${champId}/champ.json`;
}

/**
 * Construit l'URL pour récupérer les matchs d'une date spécifique
 * @param champId ID du championnat
 * @param date Date au format YYYY-MM-DD
 */
export function buildMatchDayUrl(
  champId: ChampionshipId,
  date: string
): string {
  return `${ITTF_BASE_URL}/${champId}/match/d${date}.json`;
}

/**
 * Construit l'URL pour récupérer les données de groupe d'un événement
 */
export function buildGroupUrl(
  champId: ChampionshipId,
  eventKey: string
): string {
  return `${ITTF_BASE_URL}/${champId}/groups/${eventKey}.json`;
}

/**
 * Construit l'URL pour récupérer le tableau d'élimination directe d'un événement
 */
export function buildDrawUrl(
  champId: ChampionshipId,
  eventKey: string
): string {
  return `${ITTF_BASE_URL}/${champId}/draws/${eventKey}.json`;
}

/**
 * Construit l'URL pour récupérer les détails d'un match spécifique
 */
export function buildMatchUrl(
  champId: ChampionshipId,
  matchId: string
): string {
  return `${ITTF_BASE_URL}/${champId}/match/${matchId}.json`;
}

// ============================================================================
// Event Key Parsers
// ============================================================================

/**
 * Parse une clé d'événement ITTF
 * Pattern: {TYPE}.{FORMAT}----{CODE}----
 *
 * Exemples:
 * - M.SINGLES----MS1-2--
 * - W.DOUBLES----WD14-20
 * - X.DOUBLES----XD10---
 */
export function parseEventKey(key: string): ParsedEventKey | null {
  const regex = /^([MWX])\.(SINGLES|DOUBLES)----(\S+)----$/;
  const match = key.match(regex);

  if (!match) return null;

  const type = match[1] as EventType;
  const format = match[2] as EventFormat;
  const code = match[3];

  // Extraire les numéros de classe
  const classMatch = code.match(/(\d+)(?:-(\d+))?/);
  const classes = classMatch
    ? classMatch[2]
      ? [parseInt(classMatch[1]), parseInt(classMatch[2])]
      : [parseInt(classMatch[1])]
    : undefined;

  return {
    type,
    format,
    code,
    classes,
  };
}

/**
 * Parse une clé de phase ITTF
 * Pattern: {EVENT_KEY}.{PHASE_CODE}
 *
 * Exemples:
 * - M.SINGLES----MS1----.FNL- (Finale)
 * - M.SINGLES----MS1----.SFNL (Demi-finale)
 * - M.SINGLES----MS1----.GP01 (Groupe 1)
 */
export function parsePhaseKey(key: string): ParsedPhaseKey | null {
  const parts = key.split(".");
  if (parts.length < 3) return null;

  const phaseCode = parts[parts.length - 1];
  const eventKey = key.replace(`.${phaseCode}`, "");

  return {
    eventKey,
    phaseCode,
    isFinal: phaseCode === "FNL-",
    isSemiFinal: phaseCode === "SFNL",
    isQuarterFinal: phaseCode === "QFNL",
    isRoundOf16: phaseCode === "8FNL",
    isGroup: phaseCode.startsWith("GP"),
    groupNumber: phaseCode.startsWith("GP")
      ? parseInt(phaseCode.slice(2))
      : null,
  };
}

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Retourne le label en français pour un statut de match
 */
export function getMatchStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    1: "Terminé",
    2: "En direct",
    4: "À venir",
    6: "En direct & À venir",
  };
  return labels[status] || "Inconnu";
}

/**
 * Retourne la couleur Tailwind associée à un statut
 */
export function getMatchStatusColor(status: MatchStatus): string {
  const colors: Record<MatchStatus, string> = {
    1: "gray",
    2: "red",
    4: "green",
    6: "yellow",
  };
  return colors[status] || "gray";
}

/**
 * Vérifie si un match est en direct
 */
export function isMatchLive(status: MatchStatus): boolean {
  return status === 2 || status === 6;
}

/**
 * Vérifie si un match est terminé
 */
export function isMatchFinished(status: MatchStatus): boolean {
  return status === 1;
}

/**
 * Vérifie si un match est à venir
 */
export function isMatchUpcoming(status: MatchStatus): boolean {
  return status === 4 || status === 6;
}

// ============================================================================
// Event Type Helpers
// ============================================================================

/**
 * Retourne le label en français pour un type d'événement
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    M: "Hommes",
    W: "Femmes",
    X: "Mixte",
  };
  return labels[type];
}

/**
 * Retourne le label en français pour un format d'événement
 */
export function getEventFormatLabel(format: EventFormat): string {
  const labels: Record<EventFormat, string> = {
    SINGLES: "Simple",
    DOUBLES: "Double",
  };
  return labels[format];
}

/**
 * Génère un label complet pour un événement
 */
export function getFullEventLabel(
  type: EventType,
  format: EventFormat
): string {
  return `${format === "SINGLES" ? "Simple" : "Double"} ${getEventTypeLabel(
    type
  )}`;
}

// ============================================================================
// Phase Helpers
// ============================================================================

/**
 * Retourne le label en français pour une phase
 */
export function getPhaseLabel(phaseCode: string): string {
  const labels: Record<string, string> = {
    "FNL-": "Finale",
    SFNL: "Demi-finales",
    QFNL: "Quarts de finale",
    "8FNL": "Huitièmes de finale",
  };

  if (phaseCode.startsWith("GP")) {
    const groupNum = parseInt(phaseCode.slice(2));
    return `Groupe ${groupNum}`;
  }

  return labels[phaseCode] || phaseCode;
}

/**
 * Retourne l'ordre de tri pour une phase (plus haute = plus importante)
 */
export function getPhaseOrder(phaseCode: string): number {
  const orders: Record<string, number> = {
    "FNL-": 100,
    SFNL: 90,
    QFNL: 80,
    "8FNL": 70,
  };

  if (phaseCode.startsWith("GP")) {
    return 50 - parseInt(phaseCode.slice(2));
  }

  return orders[phaseCode] || 0;
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Formate une date ISO en format lisible français
 * @param isoDate Date au format YYYY-MM-DD
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Formate une date ISO en format court
 * @param isoDate Date au format YYYY-MM-DD
 */
export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(isoDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return isoDate === today;
}

/**
 * Vérifie si une date est dans le futur
 */
export function isFuture(isoDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return isoDate > today;
}

/**
 * Vérifie si une date est dans le passé
 */
export function isPast(isoDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return isoDate < today;
}

// ============================================================================
// Smart Tournament Status Detection
// ============================================================================

/**
 * Statut intelligent d'un tournoi basé sur l'analyse des données
 */
export type SmartTournamentStatus =
  | "not_started" // Pas encore commencé
  | "active" // En cours (dates + matchs possibles)
  | "finished" // Terminé (dates passées + pas de matchs live)
  | "unknown"; // Impossible à déterminer

/**
 * Interface pour les données nécessaires à l'analyse intelligente
 */
export interface TournamentAnalysisData {
  /** Dates du tournoi */
  dates: DateInfo[];
  /** Statut officiel ITTF */
  officialStatus: boolean; // isFinished
  /** Nombre de matchs live aujourd'hui (optionnel) */
  liveMatchesCount?: number;
  /** Nombre de matchs à venir aujourd'hui (optionnel) */
  upcomingMatchesCount?: number;
}

/**
 * Détermine le statut intelligent d'un tournoi
 *
 * @param data Données du tournoi à analyser
 * @returns Statut intelligent du tournoi
 *
 * @example
 * ```typescript
 * const status = getSmartTournamentStatus({
 *   dates: championship.dates,
 *   officialStatus: championship.isFinished,
 *   liveMatchesCount: 3,
 *   upcomingMatchesCount: 5
 * });
 *
 * if (status === 'active') {
 *   // Tournoi en cours avec matchs
 * }
 * ```
 */
export function getSmartTournamentStatus(
  data: TournamentAnalysisData
): SmartTournamentStatus {
  const {
    dates,
    officialStatus,
    liveMatchesCount = 0,
    upcomingMatchesCount = 0,
  } = data;

  if (!dates || dates.length === 0) {
    return "unknown";
  }

  const today = new Date().toISOString().split("T")[0];
  const startDate = dates[0].raw;
  const endDate = dates[dates.length - 1].raw;

  // 1. Tournoi pas encore commencé
  if (today < startDate) {
    return "not_started";
  }

  // 2. Tournoi officiellement terminé selon ITTF
  if (officialStatus === true) {
    return "finished";
  }

  // 3. Tournoi dans ses dates mais analyse plus poussée
  if (today >= startDate && today <= endDate) {
    // Si on a des matchs live ou à venir, c'est actif
    if (liveMatchesCount > 0 || upcomingMatchesCount > 0) {
      return "active";
    }

    // Si on est dans les dates mais pas de matchs, on garde "active"
    // car il pourrait y avoir des matchs plus tard dans la journée
    return "active";
  }

  // 4. Tournoi après ses dates officielles
  if (today > endDate) {
    // Si l'ITTF ne l'a pas marqué comme terminé mais qu'on est après les dates
    // ET qu'il n'y a pas de matchs live, on considère qu'il est terminé
    if (liveMatchesCount === 0 && upcomingMatchesCount === 0) {
      return "finished";
    }

    // Si il y a encore des matchs (reportés par exemple), on garde actif
    return "active";
  }

  return "unknown";
}

/**
 * Retourne le label en français pour un statut intelligent
 */
export function getSmartStatusLabel(status: SmartTournamentStatus): string {
  const labels: Record<SmartTournamentStatus, string> = {
    not_started: "Pas encore commencé",
    active: "En cours",
    finished: "Terminé",
    unknown: "Statut inconnu",
  };
  return labels[status];
}

/**
 * Retourne la couleur Tailwind pour un statut intelligent
 */
export function getSmartStatusColor(status: SmartTournamentStatus): string {
  const colors: Record<SmartTournamentStatus, string> = {
    not_started: "blue",
    active: "green",
    finished: "gray",
    unknown: "yellow",
  };
  return colors[status];
}

/**
 * Retourne l'emoji pour un statut intelligent
 */
export function getSmartStatusEmoji(status: SmartTournamentStatus): string {
  const emojis: Record<SmartTournamentStatus, string> = {
    not_started: "⏳",
    active: "🔴",
    finished: "✅",
    unknown: "❓",
  };
  return emojis[status];
}

/**
 * Analyse complète d'un tournoi pour déterminer son statut
 *
 * @param championship Données complètes du championnat
 * @param liveMatchesCount Nombre de matchs live (optionnel)
 * @param upcomingMatchesCount Nombre de matchs à venir (optionnel)
 * @returns Analyse complète du statut
 */
export function analyzeTournamentStatus(
  championship: { dates: DateInfo[]; isFinished: boolean },
  liveMatchesCount: number = 0,
  upcomingMatchesCount: number = 0
) {
  const smartStatus = getSmartTournamentStatus({
    dates: championship.dates,
    officialStatus: championship.isFinished,
    liveMatchesCount,
    upcomingMatchesCount,
  });

  return {
    smart: smartStatus,
    official: championship.isFinished,
    label: getSmartStatusLabel(smartStatus),
    color: getSmartStatusColor(smartStatus),
    emoji: getSmartStatusEmoji(smartStatus),
    // Indique si le statut intelligent diffère du statut officiel
    differsFromOfficial: smartStatus === "finished" && !championship.isFinished,
  };
}

// ============================================================================
// Country Helpers
// ============================================================================

/**
 * Retourne l'emoji de drapeau pour un code pays ISO 3166-1 alpha-3
 */
export function getCountryFlag(countryCode: string): string {
  // Conversion des codes alpha-3 vers alpha-2 pour les emojis
  // Cette liste devrait être complétée avec tous les codes nécessaires
  const alpha3ToAlpha2: Record<string, string> = {
    FRA: "FR",
    CHN: "CN",
    USA: "US",
    JPN: "JP",
    GER: "DE",
    BRA: "BR",
    ESP: "ES",
    ITA: "IT",
    GBR: "GB",
    KOR: "KR",
    // Ajoutez d'autres codes selon les besoins
  };

  const alpha2 = alpha3ToAlpha2[countryCode];
  if (!alpha2) return countryCode;

  // Conversion en emoji de drapeau
  const codePoints = [...alpha2].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ============================================================================
// Score Helpers
// ============================================================================

/**
 * Détermine le gagnant d'un match basé sur les scores
 */
export function getMatchWinner(
  team1Score?: number,
  team2Score?: number
): 1 | 2 | null {
  if (team1Score === undefined || team2Score === undefined) return null;
  if (team1Score > team2Score) return 1;
  if (team2Score > team1Score) return 2;
  return null;
}

/**
 * Formate les scores d'un set
 */
export function formatGameScore(score1: number, score2: number): string {
  return `${score1}-${score2}`;
}

/**
 * Formate tous les scores de sets d'un match
 */
export function formatAllGameScores(
  team1Games?: number[],
  team2Games?: number[]
): string[] {
  if (!team1Games || !team2Games) return [];

  return team1Games.map((score, index) =>
    formatGameScore(score, team2Games[index] || 0)
  );
}

// ============================================================================
// Search & Filter Helpers
// ============================================================================

/**
 * Filtre une liste d'événements par recherche textuelle
 */
export function filterEventsBySearch(
  events: { Key: string; Desc: string }[],
  search: string
): typeof events {
  if (!search) return events;

  const searchLower = search.toLowerCase();
  return events.filter(
    (event) =>
      event.Desc.toLowerCase().includes(searchLower) ||
      event.Key.toLowerCase().includes(searchLower)
  );
}

/**
 * Groupe les événements par type et format
 */
export function groupEventsByTypeAndFormat(
  events: { Key: string; Desc: string }[]
): Record<string, typeof events> {
  return events.reduce((acc, event) => {
    const parsed = parseEventKey(event.Key);
    if (!parsed) return acc;

    const key = `${parsed.type}.${parsed.format}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);

    return acc;
  }, {} as Record<string, typeof events>);
}
