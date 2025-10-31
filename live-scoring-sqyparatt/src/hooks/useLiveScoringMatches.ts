/**
 * Hook pour gérer les matchs d'une table en live scoring (Firestore uniquement)
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import type { FirestoreMatch } from "@/types/firestore-match";
import type { LiveScoringMatch } from "@/lib/ittf/types";
import { listenToTableMatches } from "@/services/liveScoringService";

interface UseLiveScoringMatchesReturn {
  /** Matchs Firestore pour cette table */
  matches: LiveScoringMatch[];
  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: Error | undefined;
}

/**
 * Hook pour récupérer les matchs d'une table depuis Firestore (tous les matchs de l'encounter actif)
 *
 * @param table Numéro de table
 * @param date Date au format ISO (YYYY-MM-DD) - gardé pour compatibilité mais non utilisé
 * @param encounterId ID de l'encounter actif pour filtrer les matchs
 * @returns Matchs non terminés triés par date
 */
export function useLiveScoringMatches(
  table: number,
  date: string,
  encounterId?: string
): UseLiveScoringMatchesReturn {
  const [firestoreMatches, setFirestoreMatches] = useState<FirestoreMatch[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Debug logs
  console.log(
    `🔍 [useLiveScoringMatches] table: ${table}, date: ${date}, encounterId: ${encounterId}`
  );

  // Écouter les matchs Firestore pour cette table et cet encounter
  useEffect(() => {
    setIsLoading(true);
    setError(undefined);

    const unsubscribe = listenToTableMatches(
      table,
      date,
      encounterId,
      (matches) => {
        setFirestoreMatches(matches);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [table, date, encounterId]);

  // Convertir les matchs Firestore en LiveScoringMatch et filtrer les non terminés
  const matches = useMemo((): LiveScoringMatch[] => {
    return firestoreMatches
      .filter((match) => match.status !== "finished") // Seulement les matchs non terminés
      .sort((a, b) => {
        // Trier par heure prévue (scheduledTime)
        const timeA = a.scheduledTime || "";
        const timeB = b.scheduledTime || "";
        return timeA.localeCompare(timeB);
      })
      .map(
        (firestoreMatch): LiveScoringMatch => ({
          matchId: firestoreMatch.ittfMatchId,
          phase: firestoreMatch.eventKey,
          event: firestoreMatch.eventKey,
          table: `T${firestoreMatch.table}`,
          scheduledTime: firestoreMatch.scheduledTime,
          status: firestoreMatch.status === "inProgress" ? 2 : 4, // 2=Live, 4=Upcoming
          matchDesc: firestoreMatch.matchDesc, // Description du match
          firestoreId: firestoreMatch.id,
          firestoreStatus: firestoreMatch.status, // Statut Firestore
          team1: {
            names: [firestoreMatch.player1.name],
            countries: [firestoreMatch.player1.teamId],
            score: 0, // Non utilisé dans la liste, sera chargé par MatchScoreCard
            games: [], // Non utilisé dans la liste, sera chargé par MatchScoreCard
          },
          team2: {
            names: [firestoreMatch.player2.name],
            countries: [firestoreMatch.player2.teamId],
            score: 0, // Non utilisé dans la liste, sera chargé par MatchScoreCard
            games: [], // Non utilisé dans la liste, sera chargé par MatchScoreCard
          },
        })
      );
  }, [firestoreMatches]);

  console.log(
    `📊 [useLiveScoringMatches] Table ${table}: ${matches.length} matchs non terminés trouvés`
  );

  return {
    matches,
    isLoading,
    error,
  };
}
