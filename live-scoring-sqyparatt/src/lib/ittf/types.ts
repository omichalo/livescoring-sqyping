/**
 * Types TypeScript pour l'API ITTF
 * Basés sur l'analyse des endpoints TTE5677 et TTE5679
 */

// ============================================================================
// Base Types
// ============================================================================

export type ChampionshipId = `TTE${number}`;
export type EventType = "M" | "W" | "X"; // Men, Women, Mixed
export type EventFormat = "SINGLES" | "DOUBLES";
export type PhaseType = "KO" | "POOL"; // Knockout, Pool (groupes)

/**
 * Status des matchs avec valeurs combinables (bitwise)
 * 1 = Finished
 * 2 = Live
 * 4 = Upcoming
 * 6 = Live & Upcoming (2 | 4)
 */
export type MatchStatus = 1 | 2 | 4 | 6;

// ============================================================================
// Championship Data Structure
// ============================================================================

export interface ITTFChampionship {
  /** Identifiant unique du championnat (ex: TTE5677) */
  champ: ChampionshipId;

  /** Options de statut disponibles pour les filtres */
  status: StatusOption[];

  /** Dates du tournoi avec formats multiples */
  dates: DateInfo[];

  /** Description textuelle des dates (ex: "3 to 7 October") */
  datesDesc: string;

  /** Nom complet du championnat */
  champDesc: string;

  /** Lieu du championnat (ville/pays) */
  location: string;

  /** Liste des événements/épreuves */
  events: EventDefinition[];

  /** Phases de compétition (groupes + élimination directe) */
  phases: PhaseDefinition[];

  /** Tables/emplacements disponibles */
  locations: TableLocation[];

  /** Indique si le tournoi est terminé */
  isFinished: boolean;
}

export interface StatusOption {
  Key: MatchStatus;
  Desc: string;
}

export interface DateInfo {
  /** Format ISO 8601 (YYYY-MM-DD) */
  raw: string;

  /** Jour du mois (01-31) */
  day: string;

  /** Mois abrégé (Jan, Feb, Oct, etc.) */
  month: string;

  /** Format pour calendrier (ex: "Tue, 14 Oct") */
  forCal: string;
}

export interface EventDefinition {
  /** Clé de l'événement (ex: M.SINGLES----MS1-2--) */
  Key: string;

  /** Description lisible (ex: "Men's Singles Classes 1-2") */
  Desc: string;
}

export interface PhaseDefinition {
  /** Clé complète de la phase (ex: M.SINGLES----MS1----.FNL-) */
  Key: string;

  /** Description lisible de la phase */
  Desc: string;

  /** Clé de l'événement parent */
  EvKey: string;

  /** Type de phase (élimination directe ou groupe) */
  Type: PhaseType;
}

export interface TableLocation {
  /** Identifiant de la table (ex: T01, T02) */
  Key: string;

  /** Description de la table (ex: "Table 1") */
  Desc: string;
}

// ============================================================================
// Match Data Structure
// ============================================================================

// Note: RawMatchDayResponse est maintenant dans raw-types.ts

/**
 * Interface transformée pour les matchs d'une journée
 */
export interface MatchDay {
  /** Date au format ISO (YYYY-MM-DD) */
  date: string;

  /** Liste des matchs de la journée */
  matches: Match[];
}

export interface Match {
  /** Identifiant unique du match */
  matchId: string;

  /** Clé de la phase */
  phase: string;

  /** Clé de l'événement */
  event: string;

  /** Table assignée (ex: T01) */
  table: string;

  /** Heure prévue du match (format HH:MM) */
  scheduledTime?: string;

  /** Statut actuel du match */
  status: MatchStatus;

  /** Description du match depuis l'API ITTF */
  Desc?: string;

  /** Indique si le match a des compositions détaillées (joueurs connus) */
  hasComps?: boolean;

  /** Équipe/Joueur 1 */
  team1: Team;

  /** Équipe/Joueur 2 */
  team2: Team;

  /** Durée du match en minutes */
  duration?: number;

  /** Heure de début effective */
  startTime?: string;

  /** Heure de fin */
  endTime?: string;
}

export interface Team {
  /** Noms des joueurs (1 pour singles, 2 pour doubles) */
  names: string[];

  /** Codes pays (ISO 3166-1 alpha-3) */
  countries: string[];

  /** Score total (nombre de sets gagnés) */
  score?: number;

  /** Scores détaillés par set */
  games?: number[];

  /** Numéro de seed si applicable */
  seed?: number;

  /** Membres individuels en cas de match en double */
  members?: Array<{ name: string; country: string }>;
}

// ============================================================================
// Group Data Structure
// ============================================================================

export interface GroupData {
  /** Clé de l'événement */
  event: string;

  /** Description de l'événement */
  eventDesc: string;

  /** Liste des groupes */
  groups: Group[];
}

export interface Group {
  /** Identifiant du groupe (ex: GP01) */
  groupId: string;

  /** Nom du groupe (ex: "Group 1") */
  groupName: string;

  /** Classement actuel du groupe */
  standings: Standing[];

  /** Matchs du groupe */
  matches: Match[];
}

export interface Standing {
  /** Position dans le classement */
  rank: number;

  /** Informations du joueur/équipe */
  player: Player;

  /** Nombre de matchs joués */
  played: number;

  /** Nombre de matchs gagnés */
  won: number;

  /** Nombre de matchs perdus */
  lost: number;

  /** Sets gagnés */
  gamesWon: number;

  /** Sets perdus */
  gamesLost: number;

  /** Différence de sets */
  gamesDiff: number;

  /** Points marqués */
  pointsWon: number;

  /** Points encaissés */
  pointsLost: number;

  /** Différence de points */
  pointsDiff: number;
}

export interface Player {
  /** Nom complet du joueur */
  name: string;

  /** Code pays (ISO 3166-1 alpha-3) */
  country: string;

  /** Numéro de seed si applicable */
  seed?: number;

  /** Rang mondial */
  worldRank?: number;

  /** ID ITTF du joueur */
  ittfId?: string;
}

// ============================================================================
// Draw/Bracket Data Structure
// ============================================================================

export interface DrawData {
  /** Clé de l'événement */
  event: string;

  /** Description de l'événement */
  eventDesc: string;

  /** Phases d'élimination directe */
  rounds: DrawRound[];
}

export interface DrawRound {
  /** Code de la phase (FNL-, SFNL, QFNL, 8FNL) */
  roundCode: string;

  /** Nom de la phase */
  roundName: string;

  /** Matchs de cette phase */
  matches: Match[];
}

// ============================================================================
// Parsed Event Key Structure
// ============================================================================

/**
 * Structure d'une clé d'événement parsée
 * Pattern: {TYPE}.{FORMAT}----{CODE}----
 * Exemple: M.SINGLES----MS1-2--
 */
export interface ParsedEventKey {
  /** Type (M/W/X) */
  type: EventType;

  /** Format (SINGLES/DOUBLES) */
  format: EventFormat;

  /** Code de classe (MS1-2, WD14-20, etc.) */
  code: string;

  /** Classes concernées (ex: [1, 2] pour MS1-2) */
  classes?: number[];
}

/**
 * Structure d'une clé de phase parsée
 * Pattern: {EVENT_KEY}.{PHASE_CODE}
 * Exemple: M.SINGLES----MS1----.FNL-
 */
export interface ParsedPhaseKey {
  /** Clé de l'événement parent */
  eventKey: string;

  /** Code de la phase (FNL-, SFNL, QFNL, 8FNL, GP01, etc.) */
  phaseCode: string;

  /** Est-ce une finale ? */
  isFinal: boolean;

  /** Est-ce une demi-finale ? */
  isSemiFinal: boolean;

  /** Est-ce un quart de finale ? */
  isQuarterFinal: boolean;

  /** Est-ce un huitième de finale ? */
  isRoundOf16: boolean;

  /** Est-ce un groupe ? */
  isGroup: boolean;

  /** Numéro du groupe si applicable */
  groupNumber: number | null;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ITTFApiError {
  message: string;
  status: number;
  url: string;
}

export interface ITTFApiResponse<T> {
  data: T | null;
  error: ITTFApiError | null;
  isLoading: boolean;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface ChampionshipFilters {
  /** Filtrer par statut */
  status?: MatchStatus[];

  /** Filtrer par type (Hommes/Femmes/Mixte) */
  eventType?: EventType[];

  /** Filtrer par format (Singles/Doubles) */
  eventFormat?: EventFormat[];

  /** Filtrer par date */
  date?: string;

  /** Filtrer par table */
  table?: string;

  /** Recherche textuelle */
  search?: string;
}

export interface MatchFilters {
  /** Filtrer par statut du match */
  status?: MatchStatus;

  /** Filtrer par événement */
  event?: string;

  /** Filtrer par phase */
  phase?: string;

  /** Filtrer par table */
  table?: string;

  /** Filtrer par joueur */
  playerName?: string;

  /** Filtrer par pays */
  country?: string;
}

// ============================================================================
// Live Scoring Types
// ============================================================================

/**
 * Paramètres de configuration pour le live scoring
 */
export interface LiveScoringSettings {
  /** Mode de live scoring (TV = mode local, ITTF = iframe externe) */
  mode: "tv" | "ittf";
  /** Map des tables: numéro de table => activée ou non */
  enabledTables: Record<number, boolean>;
}

/**
 * Match ITTF étendu pour le live scoring avec référence Firestore
 */
export interface LiveScoringMatch extends Match {
  /** ID du document Firestore si le match a été créé/sauvegardé */
  firestoreId?: string;
  /** Description du match depuis Firestore */
  matchDesc?: string;
  /** Statut Firestore du match ("waiting" | "inProgress" | "finished" | "cancelled") */
  firestoreStatus?: "waiting" | "inProgress" | "finished" | "cancelled";
}
