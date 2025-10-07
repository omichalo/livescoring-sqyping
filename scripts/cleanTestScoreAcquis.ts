import { initializeApp, cert } from "firebase-admin/app";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

// Configuration Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function cleanTestScoreAcquis() {
  console.log("🧹 Nettoyage des données de test...");

  try {
    const batch = writeBatch(db);

    // 1. Supprimer la rencontre de test
    const encounterId = "test-encounter-score-acquis";
    await deleteDoc(doc(db, "encounters", encounterId));
    console.log("✅ Rencontre de test supprimée");

    // 2. Supprimer les équipes de test
    const team1Id = "test-team-1";
    const team2Id = "test-team-2";
    await deleteDoc(doc(db, "teams", team1Id));
    await deleteDoc(doc(db, "teams", team2Id));
    console.log("✅ Équipes de test supprimées");

    // 3. Supprimer les joueurs de test
    const playerIds = ["test-p1", "test-p2", "test-p3", "test-p4"];
    for (const playerId of playerIds) {
      await deleteDoc(doc(db, "players", playerId));
    }
    console.log("✅ Joueurs de test supprimés");

    // 4. Supprimer tous les matchs de test
    const matchesQuery = collection(db, "matches");
    const matchesSnapshot = await getDocs(matchesQuery);

    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      if (matchData.encounterId === encounterId) {
        await deleteDoc(doc(db, "matches", matchDoc.id));
      }
    }
    console.log("✅ Matchs de test supprimés");

    console.log("\n✅ Nettoyage terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage :", error);
  }
}

// Exécuter le script
cleanTestScoreAcquis()
  .then(() => {
    console.log("✅ Nettoyage terminé !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  });
