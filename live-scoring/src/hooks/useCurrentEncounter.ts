import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Encounter } from "../types";

export const useCurrentEncounter = () => {
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentEncounterQuery = query(
      collection(db, "encounters"),
      where("isCurrent", "==", true)
    );

    const unsubscribe = onSnapshot(
      currentEncounterQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setCurrentEncounter(null);
          setError("Aucune rencontre active trouvée");
        } else if (snapshot.docs.length > 1) {
          // Problème : plusieurs rencontres actives
          console.warn(
            `⚠️ ${snapshot.docs.length} rencontres actives détectées !`
          );
          console.warn(
            "Rencontres actives:",
            snapshot.docs.map((doc) => doc.id)
          );

          // Prendre la plus récente (par updatedAt)
          const encounters = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Encounter)
          );

          const mostRecent = encounters.reduce((latest, current) =>
            (current.updatedAt || current.createdAt) >
            (latest.updatedAt || latest.createdAt)
              ? current
              : latest
          );

          setCurrentEncounter(mostRecent);
          setError(
            `⚠️ Plusieurs rencontres actives détectées. Utilisation de "${mostRecent.name}"`
          );
        } else {
          const encounterDoc = snapshot.docs[0];
          const encounterData = {
            id: encounterDoc.id,
            ...encounterDoc.data(),
          } as Encounter;
          setCurrentEncounter(encounterData);
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(
          "Erreur lors de la récupération de la rencontre actuelle:",
          err
        );
        setError("Erreur lors de la récupération de la rencontre actuelle");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    currentEncounter,
    loading,
    error,
  };
};
