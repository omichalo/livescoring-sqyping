/**
 * Service Firestore pour gérer les encounters (rencontres/journées)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FirestoreEncounter, EncounterSummary } from "@/types/firestore";
import type { FirestoreMatch } from "@/types/firestore-match";

const ENCOUNTERS_COLLECTION = "encounters";
const MATCHES_COLLECTION = "matches";

/**
 * Crée ou récupère un encounter pour une date et un championnat donnés
 */
export async function getOrCreateEncounter(
  championshipId: string,
  date: string,
  numberOfTables: number = 12
): Promise<string> {
  try {
    // Chercher un encounter existant pour cette date et ce championnat
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(
      encountersRef,
      where("championshipId", "==", championshipId),
      where("date", "==", date)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Encounter existe déjà
      const existingEncounter = querySnapshot.docs[0];
      console.log(`✅ Encounter existant trouvé: ${existingEncounter.id}`);
      return existingEncounter.id;
    }

    // Créer un nouvel encounter (inactif par défaut)
    const encounterData: Omit<FirestoreEncounter, "id"> = {
      championshipId,
      date,
      name: `Jour ${date.split("-")[2]}`,
      description: `Encounter pour le championnat ${championshipId} le ${date}`,
      status: "completed", // Inactif par défaut
      numberOfTables,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCurrent: false, // Pas actif par défaut
    };

    const docRef = await addDoc(encountersRef, encounterData);
    console.log(`✅ Nouvel encounter créé: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création/récupération de l'encounter:",
      error
    );
    throw error;
  }
}

/**
 * Récupère un encounter par son ID
 */
export async function getEncounterById(
  encounterId: string
): Promise<FirestoreEncounter | null> {
  try {
    const docRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreEncounter;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'encounter:", error);
    return null;
  }
}

/**
 * Récupère tous les encounters d'un championnat
 */
export async function getEncountersByChampionship(
  championshipId: string
): Promise<FirestoreEncounter[]> {
  try {
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(
      encountersRef,
      where("championshipId", "==", championshipId)
    );

    const querySnapshot = await getDocs(q);
    const encounters: FirestoreEncounter[] = [];

    querySnapshot.forEach((doc) => {
      encounters.push({ id: doc.id, ...doc.data() } as FirestoreEncounter);
    });

    return encounters.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des encounters:", error);
    return [];
  }
}

/**
 * Récupère le résumé d'un encounter avec les statistiques des matchs
 */
export async function getEncounterSummary(
  encounterId: string
): Promise<EncounterSummary | null> {
  try {
    const encounter = await getEncounterById(encounterId);
    if (!encounter) return null;

    // Récupérer tous les matchs de cet encounter
    const matchesRef = collection(db, MATCHES_COLLECTION);
    const q = query(matchesRef, where("encounterId", "==", encounterId));
    const querySnapshot = await getDocs(q);

    const matches: FirestoreMatch[] = [];
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as FirestoreMatch);
    });

    // Calculer les statistiques
    const totalMatches = matches.length;
    const completedMatches = matches.filter(
      (m) => m.status === "finished"
    ).length;
    const inProgressMatches = matches.filter(
      (m) => m.status === "inProgress"
    ).length;
    const waitingMatches = matches.filter((m) => m.status === "waiting").length;

    return {
      encounter,
      totalMatches,
      completedMatches,
      inProgressMatches,
      waitingMatches,
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du résumé de l'encounter:",
      error
    );
    return null;
  }
}

/**
 * Met à jour le statut d'un encounter
 */
export async function updateEncounterStatus(
  encounterId: string,
  status: FirestoreEncounter["status"]
): Promise<void> {
  try {
    const docRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
    console.log(
      `✅ Statut de l'encounter ${encounterId} mis à jour: ${status}`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour du statut de l'encounter:",
      error
    );
    throw error;
  }
}

/**
 * Écoute les changements d'un encounter en temps réel
 */
export function listenToEncounter(
  encounterId: string,
  callback: (encounter: FirestoreEncounter | null) => void
): Unsubscribe {
  const docRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as FirestoreEncounter);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Erreur lors de l'écoute de l'encounter:", error);
      callback(null);
    }
  );
}

/**
 * Crée un encounter actif pour une date et un championnat donnés
 */
export async function createActiveEncounter(
  championshipId: string,
  date: string,
  numberOfTables: number = 12
): Promise<string> {
  try {
    // Désactiver tous les autres encounters actifs du même championnat
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(
      encountersRef,
      where("championshipId", "==", championshipId),
      where("isCurrent", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { isCurrent: false, updatedAt: Date.now() })
    );

    await Promise.all(updatePromises);

    // Créer le nouvel encounter (inactif par défaut)
    const encounterData: Omit<FirestoreEncounter, "id"> = {
      championshipId,
      date,
      name: `Jour ${date.split("-")[2]}`,
      description: `Encounter pour le championnat ${championshipId} le ${date}`,
      status: "completed", // Inactif par défaut
      numberOfTables,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCurrent: false, // Pas actif par défaut
    };

    const docRef = await addDoc(encountersRef, encounterData);
    console.log(`✅ Nouvel encounter actif créé: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'encounter actif:", error);
    throw error;
  }
}

/**
 * Désactive tous les encounters actifs d'un championnat
 */
export async function deactivateAllEncounters(
  championshipId: string
): Promise<void> {
  try {
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(
      encountersRef,
      where("championshipId", "==", championshipId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        status: "completed",
        updatedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);
    console.log(`✅ ${querySnapshot.size} encounters désactivés`);
  } catch (error) {
    console.error("❌ Erreur lors de la désactivation des encounters:", error);
    throw error;
  }
}

/**
 * Active une journée spécifique et désactive toutes les autres (tous tournois confondus)
 */
export async function activateEncounter(encounterId: string): Promise<void> {
  try {
    // Désactiver TOUTES les journées actives (tous tournois confondus)
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(encountersRef, where("isCurrent", "==", true));

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        isCurrent: false,
        status: "completed",
        updatedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    // Activer la journée sélectionnée
    const encounterRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);
    await updateDoc(encounterRef, {
      isCurrent: true,
      status: "active",
      updatedAt: Date.now(),
    });

    console.log(
      `✅ Journée ${encounterId} activée, toutes les autres désactivées`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'activation de la journée:", error);
    throw error;
  }
}

/**
 * Supprime un encounter (sans supprimer les matchs associés)
 */
export async function deleteEncounter(encounterId: string): Promise<void> {
  try {
    const docRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);
    await deleteDoc(docRef);
    console.log(`✅ Encounter ${encounterId} supprimé`);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'encounter:", error);
    throw error;
  }
}
