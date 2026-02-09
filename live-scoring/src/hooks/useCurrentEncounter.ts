import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Encounter } from "../types";
import {
  getSelectedEncounterId,
} from "../utils/localStorage";

export const useCurrentEncounter = () => {
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Fonction pour charger l'encounter depuis localStorage
    const loadEncounterFromLocalStorage = (): (() => void) | null => {
      const selectedId = getSelectedEncounterId();
      if (!selectedId) {
        return null;
      }

      // Vérifier si l'encounter existe toujours dans Firestore
      const encounterRef = doc(db, "encounters", selectedId);
      const unsub = onSnapshot(
        encounterRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const encounterData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
            } as Encounter;
            setCurrentEncounter(encounterData);
            setError(null);
          } else {
            // L'encounter n'existe plus, nettoyer localStorage
            setCurrentEncounter(null);
            setError("La rencontre sélectionnée n'existe plus");
          }
          setLoading(false);
        },
        (err) => {
          console.error(
            "Erreur lors de la récupération de la rencontre:",
            err
          );
          setError("Erreur lors de la récupération de la rencontre");
          setLoading(false);
        }
      );

      return unsub;
    };

    // Fonction de fallback pour la rétrocompatibilité
    const loadFallbackEncounter = (): (() => void) | null => {
      // Chercher un encounter avec isCurrent: true (ancien système)
      const fallbackQuery = query(
        collection(db, "encounters"),
        where("isCurrent", "==", true)
      );

      const unsub = onSnapshot(
        fallbackQuery,
        (snapshot) => {
          if (snapshot.empty) {
            setCurrentEncounter(null);
            setError("Aucune rencontre sélectionnée. Veuillez sélectionner une rencontre.");
            setLoading(false);
          } else {
            // Prendre le premier (ou le plus récent si plusieurs)
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
            setError(null);
            setLoading(false);
          }
        },
        (err) => {
          console.error(
            "Erreur lors de la récupération de la rencontre (fallback):",
            err
          );
          setError("Erreur lors de la récupération de la rencontre");
          setLoading(false);
        }
      );

      return unsub;
    };

    // Fonction pour recharger l'encounter
    const reloadEncounter = () => {
      if (unsubscribe) {
        unsubscribe();
      }
      const selectedId = getSelectedEncounterId();
      if (selectedId) {
        unsubscribe = loadEncounterFromLocalStorage();
      } else {
        unsubscribe = loadFallbackEncounter();
      }
    };

    // Écouter les changements de localStorage depuis d'autres onglets
    const handleStorageChange = () => {
      reloadEncounter();
    };

    // Écouter les changements de localStorage dans le même onglet (événement personnalisé)
    const handleEncounterSelectionChange = () => {
      reloadEncounter();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("encounterSelectionChanged", handleEncounterSelectionChange);

    // Charger l'encounter initial
    const selectedId = getSelectedEncounterId();
    if (selectedId) {
      // Charger depuis localStorage
      unsubscribe = loadEncounterFromLocalStorage();
    } else {
      // Fallback : chercher un encounter avec isCurrent: true
      unsubscribe = loadFallbackEncounter();
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("encounterSelectionChanged", handleEncounterSelectionChange);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    currentEncounter,
    loading,
    error,
  };
};
