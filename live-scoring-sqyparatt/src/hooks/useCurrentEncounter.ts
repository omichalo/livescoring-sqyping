/**
 * Hook pour gérer la rencontre actuelle
 */

"use client";

import { useState, useEffect } from "react";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CurrentEncounter {
  id: string;
  team1Id: string;
  team2Id: string;
  date: string;
  championshipId: string;
  status: "waiting" | "inProgress" | "finished" | "active" | "completed";
  isCurrent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export function useCurrentEncounter() {
  const [currentEncounter, setCurrentEncounter] =
    useState<CurrentEncounter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chercher d'abord un encounter marqué comme actuel
    const currentQuery = query(
      collection(db, "encounters"),
      where("isCurrent", "==", true),
      where("status", "in", ["active", "inProgress"]),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      currentQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const encounter = snapshot.docs[0].data() as CurrentEncounter;
          setCurrentEncounter({
            id: snapshot.docs[0].id,
            ...encounter,
          });
          setIsLoading(false);
          setError(null);
          return;
        }

        // Si aucun encounter actuel, chercher le plus récent actif
        const recentQuery = query(
          collection(db, "encounters"),
          where("status", "in", ["active", "inProgress"]),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const unsubscribeRecent = onSnapshot(
          recentQuery,
          (recentSnapshot) => {
            if (recentSnapshot.empty) {
              setCurrentEncounter(null);
              setIsLoading(false);
              return;
            }

            const encounter = recentSnapshot.docs[0].data() as CurrentEncounter;
            setCurrentEncounter({
              id: recentSnapshot.docs[0].id,
              ...encounter,
            });
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            console.error(
              "Erreur lors de la récupération de la rencontre récente:",
              err
            );
            setError(err.message);
            setIsLoading(false);
          }
        );

        return () => unsubscribeRecent();
      },
      (err) => {
        console.error(
          "Erreur lors de la récupération de la rencontre actuelle:",
          err
        );
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    currentEncounter,
    isLoading,
    error,
  };
}
