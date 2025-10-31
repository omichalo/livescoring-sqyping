/**
 * Service Firestore pour gérer les matchs en live scoring
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase";
import type { FirestoreMatch, ScoreSet } from "@/types/firestore-match";

/**
 * Crée ou met à jour un match dans Firestore
 * @param matchId ID du document (si omis, génération automatique)
 * @param matchData Données du match
 * @returns ID du document créé/mis à jour
 */
export async function createOrUpdateMatch(
  matchData: Partial<FirestoreMatch>,
  matchId?: string
): Promise<string> {
  try {
    const matchesRef = collection(db, COLLECTIONS.matches);
    const docId = matchId || doc(matchesRef).id;
    const docRef = doc(matchesRef, docId);

    await setDoc(
      docRef,
      {
        ...matchData,
        startTime: matchData.startTime || Date.now(),
      },
      { merge: true }
    );

    console.log(`✅ Match ${docId} créé/mis à jour dans Firestore`);
    return docId;
  } catch (error) {
    console.error("❌ Erreur lors de la création/mise à jour du match:", error);
    throw error;
  }
}

/**
 * Récupère un match par son ID
 */
export async function getMatchById(
  matchId: string
): Promise<FirestoreMatch | null> {
  try {
    const docRef = doc(db, COLLECTIONS.matches, matchId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreMatch;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du match:", error);
    return null;
  }
}

/**
 * Récupère tous les matchs d'une table pour une date donnée
 * @param table Numéro de table
 * @param date Date au format ISO (optionnel, sinon tous les matchs de la table)
 */
export async function getMatchesByTable(
  table: number,
  _date?: string
): Promise<FirestoreMatch[]> {
  try {
    const matchesRef = collection(db, COLLECTIONS.matches);
    const q = query(matchesRef, where("table", "==", table));

    // TODO: Filtrer par date si nécessaire (nécessite un champ date dans Firestore)

    const querySnapshot = await getDocs(q);
    const matches: FirestoreMatch[] = [];

    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as FirestoreMatch);
    });

    return matches;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des matchs par table:",
      error
    );
    return [];
  }
}

/**
 * Met à jour le score d'un match
 */
export async function updateMatchScore(
  matchId: string,
  score: ScoreSet[],
  setsWon: { player1: number; player2: number }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.matches, matchId);
    await updateDoc(docRef, {
      score,
      setsWon,
    });
    console.log(`✅ Score du match ${matchId} mis à jour`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du score:", error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un match
 */
export async function updateMatchStatus(
  matchId: string,
  status: FirestoreMatch["status"]
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.matches, matchId);
    await updateDoc(docRef, { status });
    console.log(`✅ Statut du match ${matchId} mis à jour: ${status}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut:", error);
    throw error;
  }
}

/**
 * Vérifie s'il y a un match en cours sur une table donnée
 * @param table Numéro de table
 * @param date Date au format ISO (YYYY-MM-DD)
 * @returns Promise<boolean> true si un match est en cours
 */
export async function hasActiveMatchOnTable(
  table: number,
  date: string
): Promise<boolean> {
  try {
    const matchesRef = collection(db, COLLECTIONS.matches);
    const q = query(
      matchesRef,
      where("table", "==", table),
      where("date", "==", date),
      where("status", "==", "inProgress")
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification des matchs actifs:",
      error
    );
    return false; // En cas d'erreur, on autorise le lancement
  }
}

/**
 * Écoute les changements en temps réel d'un match
 * @param matchId ID du match à écouter
 * @param callback Fonction appelée à chaque changement
 * @returns Fonction de désabonnement
 */
export function listenToMatch(
  matchId: string,
  callback: (match: FirestoreMatch | null) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.matches, matchId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as FirestoreMatch);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Erreur lors de l'écoute du match:", error);
      callback(null);
    }
  );
}

/**
 * Écoute les matchs en temps réel pour une table (tous les matchs de l'encounter actif)
 */
export function listenToTableMatches(
  table: number,
  date: string, // Gardé pour compatibilité mais non utilisé dans la requête
  encounterId: string | undefined, // ID de l'encounter actif
  callback: (matches: FirestoreMatch[]) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  const matchesRef = collection(db, COLLECTIONS.matches);

  // Construire la requête conditionnellement
  let q;
  if (encounterId) {
    q = query(
      matchesRef,
      where("table", "==", table),
      where("encounterId", "==", encounterId)
    );
  } else {
    q = query(matchesRef, where("table", "==", table));
  }

  return onSnapshot(
    q,
    (querySnapshot) => {
      const matches: FirestoreMatch[] = [];
      querySnapshot.forEach((doc) => {
        matches.push({ id: doc.id, ...doc.data() } as FirestoreMatch);
      });
      callback(matches);
    },
    (error) => {
      console.error(
        "❌ Erreur lors de l'écoute des matchs de la table:",
        error
      );
      if (errorCallback) {
        errorCallback(error);
      } else {
        callback([]);
      }
    }
  );
}

/**
 * Charge les matchs ITTF dans Firestore pour une date et des tables données
 * Utilise l'encounterId fourni ou crée automatiquement un encounter si nécessaire
 */
export async function loadIttfMatchesToFirestore(
  champId: string,
  date: string,
  tables: number[],
  encounterId?: string
): Promise<{ loaded: number; errors: number; encounterId: string }> {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { fetchMatchDay } = await import("@/lib/ittf/api");
    const { mapITTFMatchToFirestore } = await import("@/lib/ittf-to-firestore");
    const { getOrCreateEncounter } = await import("./encounterService");

    console.log(`🔄 Chargement des matchs ITTF pour ${champId} le ${date}...`);

    // Utiliser l'encounterId fourni ou créer/récupérer un encounter
    let finalEncounterId = encounterId;
    if (!finalEncounterId) {
      finalEncounterId = await getOrCreateEncounter(
        champId,
        date,
        Math.max(...tables)
      );
      console.log(`📅 Encounter créé/récupéré: ${finalEncounterId}`);
    } else {
      console.log(`📅 Utilisation de l'encounter fourni: ${finalEncounterId}`);
    }

    const matchDay = await fetchMatchDay(champId as any, date);
    let loaded = 0;
    let errors = 0;

    for (const match of matchDay.matches) {
      try {
        // Extraire le numéro de table
        const tableMatch = match.table.match(/T(\d+)/);
        if (!tableMatch) continue;

        const tableNumber = parseInt(tableMatch[1]);
        if (!tables.includes(tableNumber)) continue;

        // Chercher le match existant dans TOUS les matchs de l'encounter
        const allEncounterMatches = await getMatchesByEncounter(
          finalEncounterId
        );
        const existingMatch = allEncounterMatches.find(
          (m) => m.ittfMatchId === match.matchId
        );

        if (existingMatch) {
          // Détecter les changements
          const changes: Partial<FirestoreMatch> = {};
          let shouldUpdate = false;

          // Comparer les noms Desc ET les membres pour les doubles
          const player1NameFromITTF = match.team1.names[0];
          const player2NameFromITTF = match.team2.names[0];

          const player1MembersFromITTF = match.team1.members;
          const player2MembersFromITTF = match.team2.members;

          // Comparer player1 : nom Desc ET membres
          const player1NameChanged =
            player1NameFromITTF &&
            player1NameFromITTF !== existingMatch.player1.name;
          const player1MembersChanged =
            JSON.stringify(player1MembersFromITTF) !==
            JSON.stringify(existingMatch.player1.members);

          if (player1NameChanged || player1MembersChanged) {
            changes.player1 = {
              ...existingMatch.player1,
              name: player1NameFromITTF,
              teamId: match.team1.countries[0] || existingMatch.player1.teamId,
              members: player1MembersFromITTF,
            };
            shouldUpdate = true;
            console.log(
              `⚠️ Match ${match.matchId}: changement joueur 1 - nom: ${player1NameChanged}, membres: ${player1MembersChanged}`
            );
          }

          // Comparer player2 : nom Desc ET membres
          const player2NameChanged =
            player2NameFromITTF &&
            player2NameFromITTF !== existingMatch.player2.name;
          const player2MembersChanged =
            JSON.stringify(player2MembersFromITTF) !==
            JSON.stringify(existingMatch.player2.members);

          if (player2NameChanged || player2MembersChanged) {
            changes.player2 = {
              ...existingMatch.player2,
              name: player2NameFromITTF,
              teamId: match.team2.countries[0] || existingMatch.player2.teamId,
              members: player2MembersFromITTF,
            };
            shouldUpdate = true;
            console.log(
              `⚠️ Match ${match.matchId}: changement joueur 2 - nom: ${player2NameChanged}, membres: ${player2MembersChanged}`
            );
          }

          // Comparer table (gestion du changement de table)
          if (tableNumber !== existingMatch.table) {
            changes.table = tableNumber;
            shouldUpdate = true;
            console.log(
              `⚠️ Match ${match.matchId} change de table ${existingMatch.table} → ${tableNumber}`
            );
          }

          // Comparer scheduledTime
          if (match.scheduledTime !== existingMatch.scheduledTime) {
            changes.scheduledTime = match.scheduledTime || "";
            shouldUpdate = true;
          }

          // Mettre à jour si nécessaire
          if (shouldUpdate) {
            changes.ittfLastUpdate = Date.now();
            await createOrUpdateMatch(changes, existingMatch.id);
            console.log(`✅ Match ${match.matchId} mis à jour`);
          } else {
            console.log(`⚠️ Match ${match.matchId} déjà à jour, ignoré`);
          }

          continue;
        }

        // Créer le match Firestore avec l'encounter
        const firestoreMatchData = mapITTFMatchToFirestore(match, tableNumber);
        const firestoreMatch: Omit<FirestoreMatch, "id"> = {
          ittfMatchId: match.matchId,
          championshipId: champId,
          date: date,
          table: tableNumber,
          eventKey: match.event,
          matchDesc: match.Desc || match.phase,
          scheduledTime: match.scheduledTime || "",
          player1: firestoreMatchData.player1!,
          player2: firestoreMatchData.player2!,
          score: [], // Scores vides au chargement
          setsWon: { player1: 0, player2: 0 }, // Scores à 0
          matchNumber: 0, // À définir selon l'ordre
          type: firestoreMatchData.type || "single",
          status: "waiting", // Toujours en attente au chargement
          startTime: Date.now(),
          encounterId: finalEncounterId,
          order: 0, // À définir selon l'ordre
          ittfHasComps: match.hasComps || false, // Conserver l'état de la composition
          ittfLastUpdate: Date.now(), // Timestamp de la création
        };

        await createOrUpdateMatch(firestoreMatch);
        loaded++;
      } catch (error) {
        console.error(`❌ Erreur pour le match ${match.matchId}:`, error);
        errors++;
      }
    }

    console.log(
      `✅ Chargement terminé: ${loaded} matchs chargés, ${errors} erreurs`
    );
    return { loaded, errors, encounterId: finalEncounterId };
  } catch (error) {
    console.error("❌ Erreur lors du chargement des matchs ITTF:", error);
    throw error;
  }
}

/**
 * Récupère tous les matchs d'un encounter
 */
export async function getMatchesByEncounter(
  encounterId: string
): Promise<FirestoreMatch[]> {
  try {
    const matchesRef = collection(db, COLLECTIONS.matches);
    const q = query(matchesRef, where("encounterId", "==", encounterId));
    const querySnapshot = await getDocs(q);

    const matches: FirestoreMatch[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreMatch;
      matches.push({ ...data, id: doc.id });
    });

    return matches;
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs:", error);
    throw error;
  }
}

/**
 * Supprime tous les matchs d'un encounter
 */
export async function deleteMatchesByEncounter(
  encounterId: string
): Promise<number> {
  try {
    const matchesRef = collection(db, COLLECTIONS.matches);
    const q = query(matchesRef, where("encounterId", "==", encounterId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`⚠️ Aucun match trouvé pour l'encounter ${encounterId}`);
      return 0;
    }

    // Utiliser un batch pour supprimer tous les matchs
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(
      `✅ ${querySnapshot.size} matchs supprimés pour l'encounter ${encounterId}`
    );
    return querySnapshot.size;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des matchs de l'encounter:",
      error
    );
    throw error;
  }
}

/**
 * Supprime un match par son ID
 */
export async function deleteMatch(matchId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.matches, matchId);
    await deleteDoc(docRef);
    console.log(`✅ Match ${matchId} supprimé`);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du match:", error);
    throw error;
  }
}

/**
 * Marque automatiquement les matchs comme "finished" en fonction de leur heure programmée
 * @param encounterId ID de l'encounter
 * @returns Nombre de matchs mis à jour
 */
export async function autoMarkFinishedMatches(
  encounterId: string
): Promise<number> {
  try {
    const matches = await getMatchesByEncounter(encounterId);
    const now = new Date();
    let updatedCount = 0;

    // Parcourir tous les matchs
    for (const match of matches) {
      // Ignorer les matchs déjà terminés ou annulés
      if (match.status === "finished" || match.status === "cancelled") {
        continue;
      }

      // Ignorer les matchs en cours
      if (match.status === "inProgress") {
        continue;
      }

      // Vérifier si l'heure programmée est passée
      if (match.scheduledTime) {
        // Extraire l'heure depuis scheduledTime (format HH:MM)
        const timeMatch = match.scheduledTime.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const minute = parseInt(timeMatch[2]);

          // Récupérer la date du match depuis encounterId ou match.date
          const matchDate = new Date(
            match.date || now.toISOString().split("T")[0]
          );
          matchDate.setHours(hour, minute, 0, 0);

          // Si l'heure programmée est passée de plus de 2 heures
          const timeDifference = now.getTime() - matchDate.getTime();
          const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 heures en millisecondes

          if (timeDifference > twoHoursInMs) {
            // Mettre à jour le statut du match
            const docRef = doc(db, COLLECTIONS.matches, match.id!);
            await updateDoc(docRef, {
              status: "finished",
            });
            updatedCount++;
            console.log(
              `✅ Match ${match.id} marqué comme terminé (programmé à ${match.scheduledTime})`
            );
          }
        }
      }
    }

    return updatedCount;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour automatique des matchs:",
      error
    );
    throw error;
  }
}
