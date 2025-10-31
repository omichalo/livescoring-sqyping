/**
 * Hook React pour gérer les matchs d'une journée
 */

"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { ChampionshipId, MatchDay, Match, MatchStatus } from "@/lib/ittf";
import { fetchMatchDay } from "@/lib/ittf";

interface UseMatchDayOptions {
  /** Intervalle de rafraîchissement en millisecondes (défaut: 30000 = 30 secondes) */
  refreshInterval?: number;

  /** Filtrer par statut */
  filterStatus?: MatchStatus;

  /** Filtrer par table */
  filterTable?: string;

  /** Filtrer par événement */
  filterEvent?: string;
}

interface UseMatchDayReturn {
  /** Données des matchs de la journée */
  matchDay: MatchDay | undefined;

  /** Liste filtrée des matchs */
  matches: Match[];

  /** Matchs en direct */
  liveMatches: Match[];

  /** Matchs à venir */
  upcomingMatches: Match[];

  /** Matchs terminés */
  finishedMatches: Match[];

  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;

  /** Erreur éventuelle */
  error: Error | undefined;

  /** Fonction pour rafraîchir manuellement les données */
  refresh: () => Promise<MatchDay | undefined>;

  /** Indique s'il y a des matchs en direct */
  hasLiveMatches: boolean;
}

/**
 * Hook pour récupérer et gérer les matchs d'une journée
 *
 * @example
 * ```tsx
 * function TodayMatches() {
 *   const today = new Date().toISOString().split('T')[0];
 *   const { liveMatches, upcomingMatches, isLoading } = useMatchDay('TTE5679', today);
 *
 *   if (isLoading) return <div>Chargement...</div>;
 *
 *   return (
 *     <div>
 *       <h2>En Direct ({liveMatches.length})</h2>
 *       {liveMatches.map(match => <MatchCard key={match.matchId} match={match} />)}
 *
 *       <h2>À Venir ({upcomingMatches.length})</h2>
 *       {upcomingMatches.map(match => <MatchCard key={match.matchId} match={match} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMatchDay(
  champId: ChampionshipId | null | undefined,
  date: string | null | undefined,
  options: UseMatchDayOptions = {}
): UseMatchDayReturn {
  const {
    refreshInterval = 30000,
    filterStatus,
    filterTable,
    filterEvent,
  } = options;

  const { data, error, isLoading, mutate } = useSWR(
    champId && date ? `matchday-${champId}-${date}` : null,
    () => (champId && date ? fetchMatchDay(champId, date) : null),
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Filtrage et regroupement des matchs
  const matches = useMemo(() => {
    if (!data?.matches) return [];

    let filtered = data.matches;

    if (filterStatus !== undefined) {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    if (filterTable) {
      filtered = filtered.filter((m) => m.table === filterTable);
    }

    if (filterEvent) {
      filtered = filtered.filter((m) => m.event === filterEvent);
    }

    return filtered;
  }, [data, filterStatus, filterTable, filterEvent]);

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 2),
    [matches]
  );

  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === 4),
    [matches]
  );

  const finishedMatches = useMemo(
    () => matches.filter((m) => m.status === 1),
    [matches]
  );

  const refresh = async (): Promise<MatchDay | undefined> => {
    const result = await mutate();
    return result ?? undefined;
  };

  return {
    matchDay: data ?? undefined,
    matches,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    isLoading,
    error,
    refresh,
    hasLiveMatches: liveMatches.length > 0,
  };
}

/**
 * Hook pour surveiller uniquement les matchs live
 * Optimisé avec un refresh plus fréquent
 */
export function useLiveMatches(
  champId: ChampionshipId | null | undefined,
  date?: string
) {
  const today = date || new Date().toISOString().split("T")[0];

  return useMatchDay(champId, today, {
    refreshInterval: 10000, // Refresh toutes les 10 secondes pour le live
    filterStatus: 2, // Uniquement les matchs live
  });
}


