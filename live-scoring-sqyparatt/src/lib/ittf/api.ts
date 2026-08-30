/**
 * Service API pour interroger l'API ITTF
 */

import type {
  ChampionshipId,
  ITTFChampionship,
  MatchDay,
  GroupData,
  DrawData,
  Match,
  ITTFApiError,
} from "./types";

import type { RawMatchDayResponse, RawMatch } from "./raw-types";

import {
  buildChampionshipUrl,
  buildMatchDayUrl,
  buildGroupUrl,
  buildDrawUrl,
  buildMatchUrl,
} from "./utils";

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transforme un match brut de l'API en notre format Match
 */
function transformRawMatch(raw: RawMatch): Match {
  try {
    // Convertir les scores des splits en tableau de nombres
    const homeGames = raw.Home?.Splits
      ? raw.Home.Splits.filter((s) => s.Res !== "").map(
          (s) => parseInt(s.Res) || 0
        )
      : [];

    const awayGames = raw.Away?.Splits
      ? raw.Away.Splits.filter((s) => s.Res !== "").map(
          (s) => parseInt(s.Res) || 0
        )
      : [];

    // Pour les noms, on utilise toujours Desc (description de l'équipe)
    // Pour les doubles, les noms individuels seront stockés séparément dans le mapping Firestore

    return {
      matchId: raw.Key,
      phase: raw.Key, // La Key contient la phase
      event: raw.Key.split(".").slice(0, 2).join("."), // Ex: W.SINGLES
      table: raw.Loc || "",
      scheduledTime: raw.RTime,
      status: raw.Status,
      Desc: raw.Desc, // Description du match depuis l'API ITTF
      hasComps: raw.HasComps, // Indique si le match a des compositions détaillées
      team1: {
        names: [raw.Home?.Desc || ""],
        countries: [raw.Home?.Org || ""],
        score: parseInt(raw.Home?.Res || "0") || 0,
        games: homeGames,
        // Stocker les membres si présents (doubles)
        members: raw.Home?.Members?.map((m) => ({
          name: m.Desc,
          country: m.Org,
        })),
      },
      team2: {
        names: [raw.Away?.Desc || ""],
        countries: [raw.Away?.Org || ""],
        score: parseInt(raw.Away?.Res || "0") || 0,
        games: awayGames,
        // Stocker les membres si présents (doubles)
        members: raw.Away?.Members?.map((m) => ({
          name: m.Desc,
          country: m.Org,
        })),
      },
    };
  } catch (error) {
    console.error("Erreur transformation match:", raw.Key, error);
    // Retourner un match minimal en cas d'erreur
    return {
      matchId: raw.Key || "unknown",
      phase: raw.Key || "",
      event: "",
      table: raw.Loc || "",
      scheduledTime: raw.RTime || "",
      status: raw.Status || 4,
      team1: {
        names: ["Erreur"],
        countries: [""],
        score: 0,
        games: [],
      },
      team2: {
        names: ["Erreur"],
        countries: [""],
        score: 0,
        games: [],
      },
    };
  }
}

// ============================================================================
// Error Handling
// ============================================================================

class ITTFApiException extends Error {
  constructor(message: string, public status: number, public url: string) {
    super(message);
    this.name = "ITTFApiException";
  }

  toApiError(): ITTFApiError {
    return {
      message: this.message,
      status: this.status,
      url: this.url,
    };
  }
}

/**
 * Wrapper générique pour les appels fetch avec gestion d'erreurs
 * Désactive le cache du navigateur pour toujours obtenir les données à jour
 */
async function fetchJson<T>(url: string): Promise<T> {
  try {
    // Ajouter un timestamp à l'URL pour éviter le cache du navigateur
    const separator = url.includes("?") ? "&" : "?";
    const urlWithCacheBust = `${url}${separator}_t=${Date.now()}`;

    const response = await fetch(urlWithCacheBust, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store", // Désactive le cache pour fetch (sans en-têtes personnalisés pour éviter CORS)
    });

    if (!response.ok) {
      throw new ITTFApiException(
        `Erreur HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ITTFApiException) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ITTFApiException(`Erreur réseau: ${error.message}`, 0, url);
    }

    throw new ITTFApiException("Erreur inconnue", 0, url);
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Récupère les données complètes d'un championnat
 *
 * @param champId ID du championnat (ex: TTE5677)
 * @returns Données du championnat avec événements, phases, dates, etc.
 *
 * @example
 * ```ts
 * const championship = await fetchChampionship('TTE5677');
 * console.log(championship.champDesc); // "Para Elite Sao Paulo"
 * console.log(championship.isFinished); // true
 * ```
 */
export async function fetchChampionship(
  champId: ChampionshipId
): Promise<ITTFChampionship> {
  const url = buildChampionshipUrl(champId);
  return fetchJson<ITTFChampionship>(url);
}

/**
 * Récupère tous les matchs d'une date spécifique
 *
 * @param champId ID du championnat
 * @param date Date au format ISO (YYYY-MM-DD)
 * @returns Liste des matchs de la journée
 *
 * @example
 * ```ts
 * const matchDay = await fetchMatchDay('TTE5677', '2025-10-07');
 * const liveMatches = matchDay.matches.filter(m => m.status === 2);
 * ```
 */
export async function fetchMatchDay(
  champId: ChampionshipId,
  date: string
): Promise<MatchDay> {
  const url = buildMatchDayUrl(champId, date);

  // L'API retourne un objet avec des clés numériques, pas un array
  const rawResponse = await fetchJson<RawMatchDayResponse>(url);

  // Transformer l'objet en array de matchs et appliquer la transformation
  const rawMatches = Object.values(rawResponse);
  console.log(
    `📊 [fetchMatchDay] ${champId} ${date}: ${rawMatches.length} matchs bruts récupérés`
  );

  const matches = rawMatches.map(transformRawMatch);
  console.log(
    `✅ [fetchMatchDay] ${matches.length} matchs transformés avec succès`
  );

  return {
    date,
    matches,
  };
}

/**
 * Récupère les données de groupe pour un événement spécifique
 *
 * @param champId ID du championnat
 * @param eventKey Clé de l'événement (ex: M.SINGLES----MS1----)
 * @returns Données de groupe avec classements et matchs
 *
 * @example
 * ```ts
 * const groups = await fetchGroupData('TTE5679', 'M.SINGLES----MS1----');
 * groups.groups.forEach(group => {
 *   console.log(`${group.groupName}: ${group.standings.length} joueurs`);
 * });
 * ```
 */
export async function fetchGroupData(
  champId: ChampionshipId,
  eventKey: string
): Promise<GroupData> {
  const url = buildGroupUrl(champId, eventKey);
  return fetchJson<GroupData>(url);
}

/**
 * Récupère le tableau d'élimination directe pour un événement
 *
 * @param champId ID du championnat
 * @param eventKey Clé de l'événement
 * @returns Données du tableau avec rounds et matchs
 *
 * @example
 * ```ts
 * const draw = await fetchDrawData('TTE5679', 'M.SINGLES----MS1----');
 * const finals = draw.rounds.find(r => r.roundCode === 'FNL-');
 * ```
 */
export async function fetchDrawData(
  champId: ChampionshipId,
  eventKey: string
): Promise<DrawData> {
  const url = buildDrawUrl(champId, eventKey);
  return fetchJson<DrawData>(url);
}

/**
 * Récupère les détails d'un match spécifique
 *
 * @param champId ID du championnat
 * @param matchId ID du match
 * @returns Détails complets du match
 *
 * @example
 * ```ts
 * const match = await fetchMatchDetails('TTE5677', 'M001');
 * console.log(`${match.team1.names[0]} vs ${match.team2.names[0]}`);
 * ```
 */
export async function fetchMatchDetails(
  champId: ChampionshipId,
  matchId: string
): Promise<Match> {
  const url = buildMatchUrl(champId, matchId);
  return fetchJson<Match>(url);
}

// ============================================================================
// Batch & Utility Functions
// ============================================================================

/**
 * Récupère les matchs de plusieurs jours en parallèle
 *
 * @param champId ID du championnat
 * @param dates Liste de dates au format ISO
 * @returns Map de dates vers matchs
 *
 * @example
 * ```ts
 * const matchesByDate = await fetchMultipleDays('TTE5677', [
 *   '2025-10-05',
 *   '2025-10-06',
 *   '2025-10-07'
 * ]);
 * ```
 */
export async function fetchMultipleDays(
  champId: ChampionshipId,
  dates: string[]
): Promise<Map<string, MatchDay>> {
  const promises = dates.map((date) => fetchMatchDay(champId, date));
  const results = await Promise.allSettled(promises);

  const matchesByDate = new Map<string, MatchDay>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      matchesByDate.set(dates[index], result.value);
    }
  });

  return matchesByDate;
}

/**
 * Récupère tous les matchs d'un championnat pour toutes ses dates
 *
 * @param champId ID du championnat
 * @returns Map de dates vers matchs
 *
 * @example
 * ```ts
 * const allMatches = await fetchAllChampionshipMatches('TTE5677');
 * console.log(`Total de ${allMatches.size} jours de compétition`);
 * ```
 */
export async function fetchAllChampionshipMatches(
  champId: ChampionshipId
): Promise<Map<string, MatchDay>> {
  // D'abord récupérer les dates du championnat
  const championship = await fetchChampionship(champId);
  const dates = championship.dates.map((d) => d.raw);

  // Puis récupérer tous les matchs
  return fetchMultipleDays(champId, dates);
}

/**
 * Récupère les données de groupe pour tous les événements d'un championnat
 *
 * @param champId ID du championnat
 * @returns Map d'événements vers données de groupe
 */
export async function fetchAllGroupData(
  champId: ChampionshipId
): Promise<Map<string, GroupData>> {
  const championship = await fetchChampionship(champId);

  // Identifier les événements qui ont des phases de groupe
  const eventsWithGroups = championship.phases
    .filter((phase) => phase.Type === "POOL")
    .map((phase) => phase.EvKey)
    .filter((value, index, self) => self.indexOf(value) === index); // Unique

  const promises = eventsWithGroups.map((eventKey) =>
    fetchGroupData(champId, eventKey)
  );

  const results = await Promise.allSettled(promises);

  const groupsByEvent = new Map<string, GroupData>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      groupsByEvent.set(eventsWithGroups[index], result.value);
    }
  });

  return groupsByEvent;
}

/**
 * Récupère uniquement les matchs live d'un championnat
 *
 * @param champId ID du championnat
 * @param date Date optionnelle (défaut: aujourd'hui)
 * @returns Liste des matchs en direct
 *
 * @example
 * ```ts
 * const liveMatches = await fetchLiveMatches('TTE5679');
 * console.log(`${liveMatches.length} matchs en cours`);
 * ```
 */
export async function fetchLiveMatches(
  champId: ChampionshipId,
  date?: string
): Promise<Match[]> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    const matchDay = await fetchMatchDay(champId, targetDate);
    return matchDay.matches.filter((match) => match.status === 2);
  } catch (error) {
    // Si la date n'existe pas ou erreur, retourner tableau vide
    return [];
  }
}

/**
 * Récupère les matchs à venir d'un championnat
 *
 * @param champId ID du championnat
 * @param date Date optionnelle (défaut: aujourd'hui)
 * @returns Liste des matchs à venir
 */
export async function fetchUpcomingMatches(
  champId: ChampionshipId,
  date?: string
): Promise<Match[]> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    const matchDay = await fetchMatchDay(champId, targetDate);
    return matchDay.matches.filter((match) => match.status === 4);
  } catch (error) {
    return [];
  }
}

/**
 * Vérifie si un championnat est actuellement actif (a des matchs live)
 *
 * @param champId ID du championnat
 * @returns true si le championnat a des matchs live
 */
export async function isChampionshipLive(
  champId: ChampionshipId
): Promise<boolean> {
  const liveMatches = await fetchLiveMatches(champId);
  return liveMatches.length > 0;
}

// ============================================================================
// Cache & Optimization
// ============================================================================

/**
 * Pré-charge les données d'un championnat en cache
 * Utile pour améliorer les performances lors de la navigation
 *
 * @param champId ID du championnat
 */
export async function prefetchChampionship(
  champId: ChampionshipId
): Promise<void> {
  try {
    await fetchChampionship(champId);
  } catch (error) {
    // Ignorer les erreurs de préchargement
    console.warn(`Impossible de précharger ${champId}:`, error);
  }
}

/**
 * Pré-charge les données d'une date spécifique
 *
 * @param champId ID du championnat
 * @param date Date au format ISO
 */
export async function prefetchMatchDay(
  champId: ChampionshipId,
  date: string
): Promise<void> {
  try {
    await fetchMatchDay(champId, date);
  } catch (error) {
    console.warn(`Impossible de précharger les matchs du ${date}:`, error);
  }
}
