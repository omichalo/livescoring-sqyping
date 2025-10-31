/**
 * Hook React pour gérer les données de groupe
 */

"use client";

import useSWR from "swr";
import type { ChampionshipId, GroupData } from "@/lib/ittf";
import { fetchGroupData } from "@/lib/ittf";

interface UseGroupDataOptions {
  /** Intervalle de rafraîchissement en millisecondes (défaut: 60000 = 1 minute) */
  refreshInterval?: number;
}

interface UseGroupDataReturn {
  /** Données des groupes */
  groupData: GroupData | undefined;

  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;

  /** Erreur éventuelle */
  error: Error | undefined;

  /** Fonction pour rafraîchir manuellement les données */
  refresh: () => Promise<GroupData | undefined>;
}

/**
 * Hook pour récupérer et gérer les données de groupe d'un événement
 *
 * @example
 * ```tsx
 * function GroupStandings() {
 *   const { groupData, isLoading } = useGroupData('TTE5679', 'M.SINGLES----MS1----');
 *
 *   if (isLoading) return <div>Chargement...</div>;
 *   if (!groupData) return null;
 *
 *   return (
 *     <div>
 *       {groupData.groups.map(group => (
 *         <div key={group.groupId}>
 *           <h3>{group.groupName}</h3>
 *           <table>
 *             {group.standings.map(standing => (
 *               <tr key={standing.player.name}>
 *                 <td>{standing.rank}</td>
 *                 <td>{standing.player.name}</td>
 *                 <td>{standing.won}-{standing.lost}</td>
 *               </tr>
 *             ))}
 *           </table>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGroupData(
  champId: ChampionshipId | null | undefined,
  eventKey: string | null | undefined,
  options: UseGroupDataOptions = {}
): UseGroupDataReturn {
  const { refreshInterval = 60000 } = options;

  const { data, error, isLoading, mutate } = useSWR(
    champId && eventKey ? `group-${champId}-${eventKey}` : null,
    () => (champId && eventKey ? fetchGroupData(champId, eventKey) : null),
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  const refresh = async (): Promise<GroupData | undefined> => {
    const result = await mutate();
    return result ?? undefined;
  };

  return {
    groupData: data ?? undefined,
    isLoading,
    error,
    refresh,
  };
}


