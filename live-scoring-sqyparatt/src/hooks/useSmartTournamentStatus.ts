/**
 * Hook pour utiliser l'algorithme intelligent de détection de statut de tournoi
 */

"use client";

import { useMemo } from "react";
import type { ITTFChampionship } from "@/lib/ittf";
import { analyzeTournamentStatus } from "@/lib/ittf";

interface UseSmartTournamentStatusProps {
  championship?: ITTFChampionship;
  liveMatchesCount?: number;
  upcomingMatchesCount?: number;
}

/**
 * Hook qui analyse le statut intelligent d'un tournoi
 *
 * @example
 * ```tsx
 * function ChampionshipCard({ championship }) {
 *   const { smartStatus } = useSmartTournamentStatus({
 *     championship,
 *     liveMatchesCount: 3,
 *     upcomingMatchesCount: 5
 *   });
 *
 *   return (
 *     <div className={`border-${smartStatus.color}-500`}>
 *       <span className={`bg-${smartStatus.color}-100`}>
 *         {smartStatus.emoji} {smartStatus.label}
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSmartTournamentStatus({
  championship,
  liveMatchesCount = 0,
  upcomingMatchesCount = 0,
}: UseSmartTournamentStatusProps) {
  return useMemo(() => {
    if (!championship) {
      return {
        smart: "unknown" as const,
        official: false,
        label: "Statut inconnu",
        color: "yellow",
        emoji: "❓",
        differsFromOfficial: false,
      };
    }

    return analyzeTournamentStatus(
      championship,
      liveMatchesCount,
      upcomingMatchesCount
    );
  }, [championship, liveMatchesCount, upcomingMatchesCount]);
}


