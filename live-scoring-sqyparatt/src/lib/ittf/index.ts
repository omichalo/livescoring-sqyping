/**
 * Module ITTF - Export central
 */

// Types
export type {
  ChampionshipId,
  EventType,
  EventFormat,
  PhaseType,
  MatchStatus,
  ITTFChampionship,
  StatusOption,
  DateInfo,
  EventDefinition,
  PhaseDefinition,
  TableLocation,
  MatchDay,
  Match,
  Team,
  GroupData,
  Group,
  Standing,
  Player,
  DrawData,
  DrawRound,
  ParsedEventKey,
  ParsedPhaseKey,
  ITTFApiError,
  ITTFApiResponse,
  ChampionshipFilters,
  MatchFilters,
  LiveScoringSettings,
  LiveScoringMatch,
} from "./types";

// Raw API Types (for advanced usage)
export type {
  RawMatch,
  RawParticipant,
  RawSplit,
  RawMatchDayResponse,
} from "./raw-types";

// API Functions
export {
  fetchChampionship,
  fetchMatchDay,
  fetchGroupData,
  fetchDrawData,
  fetchMatchDetails,
  fetchMultipleDays,
  fetchAllChampionshipMatches,
  fetchAllGroupData,
  fetchLiveMatches,
  fetchUpcomingMatches,
  isChampionshipLive,
  prefetchChampionship,
  prefetchMatchDay,
} from "./api";

// Utility Functions
export {
  buildChampionshipUrl,
  buildMatchDayUrl,
  buildGroupUrl,
  buildDrawUrl,
  buildMatchUrl,
  parseEventKey,
  parsePhaseKey,
  getMatchStatusLabel,
  getMatchStatusColor,
  isMatchLive,
  isMatchFinished,
  isMatchUpcoming,
  getEventTypeLabel,
  getEventFormatLabel,
  getFullEventLabel,
  getPhaseLabel,
  getPhaseOrder,
  formatDate,
  formatDateShort,
  isToday,
  isFuture,
  isPast,
  getCountryFlag,
  getMatchWinner,
  formatGameScore,
  formatAllGameScores,
  filterEventsBySearch,
  groupEventsByTypeAndFormat,
  // Smart Tournament Status
  getSmartTournamentStatus,
  getSmartStatusLabel,
  getSmartStatusColor,
  getSmartStatusEmoji,
  analyzeTournamentStatus,
} from "./utils";
