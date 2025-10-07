import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Match, Encounter } from "../types";

/**
 * Service pour gérer la logique des rencontres de tennis de table
 * Format N1/N2/N3 : 14 matchs, victoire à 8 matchs gagnés
 */

export class EncounterService {
  /**
   * Vérifie si une rencontre est terminée (8 victoires atteintes)
   */
  static async checkEncounterCompletion(encounterId: string): Promise<{
    isCompleted: boolean;
    winnerTeamId?: string;
    team1Victories: number;
    team2Victories: number;
  }> {
    // Récupérer la rencontre pour avoir les team1Id et team2Id
    const encounterRef = doc(db, "encounters", encounterId);
    const encounterDoc = await getDoc(encounterRef);

    if (!encounterDoc.exists()) {
      throw new Error(`Rencontre ${encounterId} non trouvée`);
    }

    const encounter = encounterDoc.data() as Encounter;
    const team1Id = encounter.team1Id;
    const team2Id = encounter.team2Id;

    const matchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", encounterId),
      where("status", "in", ["finished"])
    );

    const matchesSnapshot = await getDocs(matchesQuery);
    const finishedMatches = matchesSnapshot.docs.map(
      (doc) => doc.data() as Match
    );

    // Compter les victoires par équipe en utilisant les teamId des joueurs
    let team1Victories = 0;
    let team2Victories = 0;

    for (const match of finishedMatches) {
      const setsWon = match.setsWon;
      if (setsWon.player1 === 3) {
        // Joueur 1 gagne -> vérifier son équipe
        if (match.player1.teamId === team1Id) {
          team1Victories++;
        } else if (match.player1.teamId === team2Id) {
          team2Victories++;
        }
      } else if (setsWon.player2 === 3) {
        // Joueur 2 gagne -> vérifier son équipe
        if (match.player2.teamId === team1Id) {
          team1Victories++;
        } else if (match.player2.teamId === team2Id) {
          team2Victories++;
        }
      }
    }

    const isCompleted = team1Victories >= 8 || team2Victories >= 8;
    const winnerTeamId = isCompleted
      ? team1Victories >= 8
        ? team1Id
        : team2Id
      : undefined;

    console.log(
      `📊 Score de la rencontre ${encounterId}: ${team1Victories}-${team2Victories} (${
        isCompleted ? "TERMINÉE" : "EN COURS"
      })`
    );

    return {
      isCompleted,
      winnerTeamId,
      team1Victories,
      team2Victories,
    };
  }

  /**
   * Annule tous les matchs à venir d'une rencontre terminée
   */
  static async cancelUpcomingMatches(encounterId: string): Promise<void> {
    const upcomingMatchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", encounterId),
      where("status", "==", "waiting")
    );

    const matchesSnapshot = await getDocs(upcomingMatchesQuery);

    // Annuler tous les matchs en attente
    const updatePromises = matchesSnapshot.docs.map((docRef) =>
      updateDoc(doc(db, "matches", docRef.id), { status: "cancelled" })
    );

    await Promise.all(updatePromises);

    console.log(
      `🚫 ${matchesSnapshot.docs.length} matchs annulés pour la rencontre ${encounterId}`
    );
  }

  /**
   * Met à jour le statut d'une rencontre
   */
  static async updateEncounterStatus(
    encounterId: string,
    status: Encounter["status"]
  ): Promise<void> {
    const encounterRef = doc(db, "encounters", encounterId);
    const updateData: Partial<Encounter> = {
      status,
      updatedAt: Date.now(),
    };

    await updateDoc(encounterRef, updateData);

    console.log(`📊 Rencontre ${encounterId} mise à jour, statut: ${status}`);
  }

  /**
   * Traite la fin d'un match et vérifie si la rencontre est terminée
   */
  static async processMatchCompletion(match: Match): Promise<void> {
    if (!match.encounterId) {
      console.log("⚠️ Match sans encounterId, traitement standard");
      return;
    }

    const encounterStatus = await this.checkEncounterCompletion(
      match.encounterId
    );

    if (encounterStatus.isCompleted) {
      console.log(
        `🏆 Rencontre ${match.encounterId} terminée ! Score: ${encounterStatus.team1Victories}-${encounterStatus.team2Victories}`
      );

      // Annuler les matchs à venir
      await this.cancelUpcomingMatches(match.encounterId);

      // Mettre à jour le statut de la rencontre
      await this.updateEncounterStatus(match.encounterId, "completed");
    } else {
      // Mettre à jour le statut de la rencontre
      await this.updateEncounterStatus(match.encounterId, "active");
    }
  }

  /**
   * Écoute les changements d'une rencontre en temps réel
   */
  static subscribeToEncounter(
    encounterId: string,
    callback: (encounter: Encounter | null) => void
  ) {
    const encounterRef = doc(db, "encounters", encounterId);

    return onSnapshot(encounterRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Encounter);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Récupère tous les matchs d'une rencontre
   */
  static async getEncounterMatches(encounterId: string): Promise<Match[]> {
    const matchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", encounterId)
    );

    const matchesSnapshot = await getDocs(matchesQuery);
    return matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Match[];
  }
}
