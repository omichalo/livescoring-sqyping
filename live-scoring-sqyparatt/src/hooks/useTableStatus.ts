/**
 * Hook pour vérifier le statut d'une table (si un match est en cours)
 * Récupère tous les matchs de l'encounter actif pour cette table
 */

"use client";

import { useState, useEffect } from "react";
import { listenToTableMatches } from "@/services/liveScoringService";
import type { FirestoreMatch } from "@/types/firestore-match";

interface UseTableStatusReturn {
  /** Indique si un match est en cours sur cette table */
  hasActiveMatch: boolean;
  /** Indique si la vérification est en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: Error | undefined;
}

/**
 * Hook pour vérifier s'il y a un match en cours sur une table
 *
 * @param table Numéro de table
 * @param date Date au format ISO (YYYY-MM-DD)
 * @param encounterId ID de l'encounter actif pour filtrer les matchs
 * @returns Statut de la table
 */
export function useTableStatus(
  table: number,
  date: string,
  encounterId?: string
): UseTableStatusReturn {
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    setIsLoading(true);
    setError(undefined);

    // Écouter les changements en temps réel des matchs sur cette table
    const unsubscribe = listenToTableMatches(
      table,
      date,
      encounterId,
      (matches: FirestoreMatch[]) => {
        // Vérifier s'il y a au moins un match avec le statut "inProgress"
        const hasActive = matches.some(
          (match) => match.status === "inProgress"
        );
        setHasActiveMatch(hasActive);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [table, date, encounterId]);

  return {
    hasActiveMatch,
    isLoading,
    error,
  };
}
