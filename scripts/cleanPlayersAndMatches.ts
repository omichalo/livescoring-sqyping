import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  writeBatch,
} from "firebase/firestore";

// Configuration Firebase (utilisez votre propre configuration)
const firebaseConfig = {
  // Ajoutez votre configuration Firebase ici
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanPlayersAndMatches() {
  console.log("🧹 Début du nettoyage des joueurs et matchs...");

  try {
    // Supprimer tous les joueurs
    console.log("📋 Récupération des joueurs...");
    const playersSnapshot = await getDocs(collection(db, "players"));
    console.log(`📋 ${playersSnapshot.size} joueurs trouvés`);

    if (playersSnapshot.size > 0) {
      const batch = writeBatch(db);
      playersSnapshot.forEach((playerDoc) => {
        batch.delete(doc(db, "players", playerDoc.id));
      });
      await batch.commit();
      console.log("✅ Tous les joueurs ont été supprimés");
    }

    // Supprimer tous les matchs
    console.log("🏓 Récupération des matchs...");
    const matchesSnapshot = await getDocs(collection(db, "matches"));
    console.log(`🏓 ${matchesSnapshot.size} matchs trouvés`);

    if (matchesSnapshot.size > 0) {
      const batch = writeBatch(db);
      matchesSnapshot.forEach((matchDoc) => {
        batch.delete(doc(db, "matches", matchDoc.id));
      });
      await batch.commit();
      console.log("✅ Tous les matchs ont été supprimés");
    }

    // Afficher les rencontres existantes pour référence
    console.log("🏆 Récupération des rencontres...");
    const encountersSnapshot = await getDocs(collection(db, "encounters"));
    console.log(`🏆 ${encountersSnapshot.size} rencontres trouvées:`);

    encountersSnapshot.forEach((encounterDoc) => {
      const encounterData = encounterDoc.data();
      console.log(
        `  - ${encounterData.name} (ID: ${encounterDoc.id}, Actuelle: ${
          encounterData.isCurrent || false
        })`
      );
    });

    // Afficher les équipes existantes pour référence
    console.log("👥 Récupération des équipes...");
    const teamsSnapshot = await getDocs(collection(db, "teams"));
    console.log(`👥 ${teamsSnapshot.size} équipes trouvées:`);

    teamsSnapshot.forEach((teamDoc) => {
      const teamData = teamDoc.data();
      console.log(
        `  - ${teamData.name} (ID: ${teamDoc.id}, Ordre: ${
          teamData.order || "non défini"
        })`
      );
    });

    console.log("\n🎉 Nettoyage terminé avec succès !");
    console.log("📝 Vous pouvez maintenant :");
    console.log("   1. Créer une nouvelle rencontre via /encounters/new");
    console.log("   2. Définir cette rencontre comme active (bouton étoile)");
    console.log(
      "   3. Recréer les joueurs via la page de création des joueurs"
    );
    console.log("   4. Recréer les matchs via la page de création des matchs");
    console.log(
      "   5. Les nouveaux joueurs et matchs seront automatiquement associés à la rencontre active"
    );
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  }
}

// Exécuter le script
cleanPlayersAndMatches()
  .then(() => {
    console.log("Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
