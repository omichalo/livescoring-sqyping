import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Milestone {
  id?: string;
  tableNumber: number;
  timestamp: Timestamp;
  date: string; // Format YYYY-MM-DD pour faciliter les requêtes
  time: string; // Format HH:MM:SS
  encounterId: string;
  createdAt: Timestamp;
  // Informations du match (ajoutées pour le mode TV)
  matchInfo?: {
    matchId: string;
    player1Name: string;
    player2Name: string;
    player1Country?: string;
    player2Country?: string;
    matchStartTime: number; // Timestamp de début du match
    timeSinceStart: number; // Temps écoulé depuis le début (en secondes)
    currentScore: {
      player1: number;
      player2: number;
    };
    setsWon: {
      player1: number;
      player2: number;
    };
    matchStatus: "waiting" | "inProgress" | "finished" | "cancelled";
    matchDesc?: string; // Description du match
  };
}

export const milestoneService = {
  // Ajouter un point marquant
  async addMilestone(
    tableNumber: number,
    encounterId: string
  ): Promise<string> {
    const now = new Date();
    const timestamp = Timestamp.fromDate(now);

    const milestone: Omit<Milestone, "id"> = {
      tableNumber,
      timestamp,
      date: now.toISOString().split("T")[0], // YYYY-MM-DD
      time: now.toTimeString().split(" ")[0], // HH:MM:SS
      encounterId,
      createdAt: timestamp,
    };

    const docRef = await addDoc(collection(db, "milestones"), milestone);
    return docRef.id;
  },

  // Ajouter un point marquant avec informations du match (pour mode TV)
  async addMilestoneWithMatchInfo(
    tableNumber: number,
    encounterId: string,
    matchInfo: Milestone["matchInfo"]
  ): Promise<string> {
    const now = new Date();
    const timestamp = Timestamp.fromDate(now);

    const milestone: Omit<Milestone, "id"> = {
      tableNumber,
      timestamp,
      date: now.toISOString().split("T")[0], // YYYY-MM-DD
      time: now.toTimeString().split(" ")[0], // HH:MM:SS
      encounterId,
      createdAt: timestamp,
      matchInfo,
    };

    const docRef = await addDoc(collection(db, "milestones"), milestone);
    return docRef.id;
  },

  // Récupérer tous les points marquants
  async getAllMilestones(): Promise<Milestone[]> {
    const q = query(collection(db, "milestones"), orderBy("timestamp", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Milestone)
    );
  },

  // Récupérer les points marquants par table
  async getMilestonesByTable(tableNumber: number): Promise<Milestone[]> {
    const q = query(
      collection(db, "milestones"),
      where("tableNumber", "==", tableNumber),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Milestone)
    );
  },

  // Récupérer les points marquants par date
  async getMilestonesByDate(date: string): Promise<Milestone[]> {
    const q = query(
      collection(db, "milestones"),
      where("date", "==", date),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Milestone)
    );
  },

  // Récupérer les points marquants avec filtres
  async getMilestonesWithFilters(filters: {
    tableNumber?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Milestone[]> {
    let q = query(collection(db, "milestones"));

    // Filtre par table
    if (filters.tableNumber !== undefined) {
      q = query(q, where("tableNumber", "==", filters.tableNumber));
    }

    // Filtre par date exacte
    if (filters.date) {
      q = query(q, where("date", "==", filters.date));
    }

    // Filtre par plage de dates
    if (filters.startDate) {
      q = query(q, where("date", ">=", filters.startDate));
    }
    if (filters.endDate) {
      q = query(q, where("date", "<=", filters.endDate));
    }

    q = query(q, orderBy("timestamp", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Milestone)
    );
  },

  // Récupérer les tables disponibles (depuis les milestones existants)
  async getAvailableTables(): Promise<number[]> {
    const q = query(collection(db, "milestones"));
    const querySnapshot = await getDocs(q);

    const tables = new Set<number>();
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.tableNumber) {
        tables.add(data.tableNumber);
      }
    });

    return Array.from(tables).sort((a, b) => a - b);
  },

  // Récupérer les tables disponibles depuis les encounters (alternative)
  async getTablesFromEncounters(): Promise<number[]> {
    const q = query(collection(db, "encounters"));
    const querySnapshot = await getDocs(q);

    const tables = new Set<number>();
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.table && typeof data.table === "number") {
        tables.add(data.table);
      }
    });

    return Array.from(tables).sort((a, b) => a - b);
  },
};
