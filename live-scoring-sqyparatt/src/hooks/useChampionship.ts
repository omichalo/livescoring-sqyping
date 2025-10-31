/**
 * Hook React pour gérer les données d'un championnat ITTF
 */

"use client";

import { useRef, useEffect } from "react";
import useSWR from "swr";
import type { ChampionshipId, ITTFChampionship } from "@/lib/ittf";
import { fetchChampionship } from "@/lib/ittf";

interface UseChampionshipOptions {
  /** Intervalle de rafraîchissement en millisecondes (défaut: 60000 = 1 minute) */
  refreshInterval?: number;

  /** Activer le rafraîchissement automatique uniquement si le championnat n'est pas terminé */
  autoRefresh?: boolean;
}

interface UseChampionshipReturn {
  /** Données du championnat */
  championship: ITTFChampionship | undefined;

  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;

  /** Erreur éventuelle */
  error: Error | undefined;

  /** Fonction pour rafraîchir manuellement les données */
  refresh: () => Promise<ITTFChampionship | undefined>;

  /** Indique si le championnat est en cours (pas terminé) */
  isActive: boolean;
}

/**
 * Hook pour récupérer et gérer les données d'un championnat ITTF
 *
 * @example
 * ```tsx
 * function ChampionshipPage() {
 *   const { championship, isLoading, error, refresh } = useChampionship('TTE5677');
 *
 *   if (isLoading) return <div>Chargement...</div>;
 *   if (error) return <div>Erreur: {error.message}</div>;
 *   if (!championship) return null;
 *
 *   return (
 *     <div>
 *       <h1>{championship.champDesc}</h1>
 *       <p>{championship.location}</p>
 *       <button onClick={refresh}>Rafraîchir</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChampionship(
  champId: ChampionshipId | null | undefined,
  options: UseChampionshipOptions = {}
): UseChampionshipReturn {
  const { refreshInterval = 60000, autoRefresh = true } = options;

  // Utiliser une ref pour stocker l'erreur et l'utiliser dans isPaused
  const errorRef = useRef<Error | undefined>(undefined);

  const { data, error, isLoading, mutate } = useSWR(
    champId ? `championship-${champId}` : null,
    () => (champId ? fetchChampionship(champId) : null),
    {
      refreshInterval: (data) => {
        // Ne pas rafraîchir si une erreur est présente (API down)
        if (errorRef.current) return 0;
        // Ne rafraîchir que si autoRefresh est activé et le championnat pas terminé
        if (!autoRefresh) return 0;
        if (data && data.isFinished) return 0;
        return refreshInterval;
      },
      isPaused: () => !!errorRef.current, // Pause le rafraîchissement automatique si erreur
      revalidateOnFocus: false, // Désactivé pour éviter les refresh lors du focus (surtout si API down)
      revalidateOnReconnect: false, // Désactivé pour éviter les refresh automatiques lors de reconnexion
      shouldRetryOnError: false, // Ne pas réessayer automatiquement en cas d'erreur
      dedupingInterval: 10000, // Éviter les doublons pendant 10 secondes
    }
  );

  // Mettre à jour la ref à chaque changement d'erreur
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  const refresh = async (): Promise<ITTFChampionship | undefined> => {
    const result = await mutate();
    return result ?? undefined;
  };

  return {
    championship: data ?? undefined,
    isLoading,
    error,
    refresh,
    isActive: data ? !data.isFinished : false,
  };
}

/**
 * Hook pour récupérer plusieurs championnats en parallèle
 *
 * @example
 * ```tsx
 * function ChampionshipsList() {
 *   const championships = useMultipleChampionships(['TTE5677', 'TTE5679']);
 *
 *   return (
 *     <div>
 *       {championships.map(({ champId, championship, isLoading }) => (
 *         <div key={champId}>
 *           {isLoading ? 'Chargement...' : championship?.champDesc}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultipleChampionships(champIds: ChampionshipId[]) {
  const results = champIds.map((champId) => ({
    champId,
    ...useChampionship(champId),
  }));

  return results;
}
