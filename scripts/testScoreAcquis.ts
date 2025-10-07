import { initializeApp, cert } from "firebase-admin/app";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  addDoc,
  setDoc,
  Timestamp,
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

async function setupTestScoreAcquis() {
  console.log("🧪 Configuration du test de score acquis...");
  console.log("📡 Connexion à Firebase...");

  try {
    // 1. Créer les équipes
    console.log("👥 Création des équipes...");
    const team1Id = "test-team-1";
    const team2Id = "test-team-2";

    await setDoc(doc(db, "teams", team1Id), {
      id: team1Id,
      name: "Équipe Test 1",
      matchesWon: 7, // 7 victoires - proche du score acquis
      order: 1,
    });

    await setDoc(doc(db, "teams", team2Id), {
      id: team2Id,
      name: "Équipe Test 2",
      matchesWon: 6, // 6 victoires
      order: 2,
    });

    console.log("✅ Équipes créées");

    // 2. Créer la rencontre
    const encounterId = "test-encounter-score-acquis";
    const encounterData = {
      id: encounterId,
      name: "Test Score Acquis",
      description:
        "Rencontre de test pour vérifier le score acquis à 8 victoires",
      status: "active",
      team1Id: team1Id,
      team2Id: team2Id,
      numberOfTables: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCurrent: true,
    };

    await setDoc(doc(db, "encounters", encounterId), encounterData);
    console.log("✅ Rencontre créée");

    // 3. Créer les joueurs
    console.log("👤 Création des joueurs...");
    const players = [
      {
        id: "test-p1",
        name: "Joueur A1",
        teamId: team1Id,
        encounterId: encounterId,
        order: 1,
      },
      {
        id: "test-p2",
        name: "Joueur A2",
        teamId: team1Id,
        encounterId: encounterId,
        order: 2,
      },
      {
        id: "test-p3",
        name: "Joueur B1",
        teamId: team2Id,
        encounterId: encounterId,
        order: 1,
      },
      {
        id: "test-p4",
        name: "Joueur B2",
        teamId: team2Id,
        encounterId: encounterId,
        order: 2,
      },
    ];

    for (const player of players) {
      await setDoc(doc(db, "players", player.id), player);
    }
    console.log("✅ Joueurs créés");

    // 4. Créer les matchs terminés (7 victoires pour équipe 1, 6 pour équipe 2)
    console.log("🏓 Création des matchs...");
    const batch = writeBatch(db);

    // 7 matchs gagnés par l'équipe 1
    for (let i = 1; i <= 7; i++) {
      const matchId = `test-match-${i}`;
      const matchData = {
        id: matchId,
        player1: players[0], // Joueur A1 (équipe 1)
        player2: players[2], // Joueur B1 (équipe 2)
        score: [
          { player1: 11, player2: 9 },
          { player1: 11, player2: 7 },
          { player1: 11, player2: 8 },
        ],
        setsWon: { player1: 3, player2: 0 },
        table: 1,
        matchNumber: i,
        status: "finished",
        startTime: Date.now() - (8 - i) * 60000, // 1 minute d'écart entre chaque match
        encounterId: encounterId,
        order: i,
      };

      batch.set(doc(db, "matches", matchId), matchData);
    }

    // 6 matchs gagnés par l'équipe 2
    for (let i = 8; i <= 13; i++) {
      const matchId = `test-match-${i}`;
      const matchData = {
        id: matchId,
        player1: players[1], // Joueur A2 (équipe 1)
        player2: players[3], // Joueur B2 (équipe 2)
        score: [
          { player1: 9, player2: 11 },
          { player1: 7, player2: 11 },
          { player1: 8, player2: 11 },
        ],
        setsWon: { player1: 0, player2: 3 },
        table: 2,
        matchNumber: i,
        status: "finished",
        startTime: Date.now() - (14 - i) * 60000,
        encounterId: encounterId,
        order: i,
      };

      batch.set(doc(db, "matches", matchId), matchData);
    }

    // 5. Créer le match décisif (en cours) - celui qui peut faire gagner l'équipe 1
    const decisiveMatchId = "test-match-decisif";
    const decisiveMatchData = {
      id: decisiveMatchId,
      player1: players[0], // Joueur A1 (équipe 1)
      player2: players[2], // Joueur B1 (équipe 2)
      score: [
        { player1: 11, player2: 9 },
        { player1: 11, player2: 7 },
        { player1: 10, player2: 8 }, // Match en cours, 10-8 dans le 3ème set
      ],
      setsWon: { player1: 2, player2: 0 },
      table: 1,
      matchNumber: 14,
      status: "inProgress",
      startTime: Date.now() - 300000, // Commencé il y a 5 minutes
      encounterId: encounterId,
      order: 14,
    };

    batch.set(doc(db, "matches", decisiveMatchId), decisiveMatchData);

    // 6. Créer quelques matchs en attente (qui seront annulés si l'équipe 1 gagne)
    for (let i = 15; i <= 17; i++) {
      const matchId = `test-match-${i}`;
      const matchData = {
        id: matchId,
        player1: players[1], // Joueur A2 (équipe 1)
        player2: players[3], // Joueur B2 (équipe 2)
        score: [],
        setsWon: { player1: 0, player2: 0 },
        table: 2,
        matchNumber: i,
        status: "waiting",
        startTime: 0,
        encounterId: encounterId,
        order: i,
      };

      batch.set(doc(db, "matches", matchId), matchData);
    }

    console.log("💾 Sauvegarde des matchs en base...");
    await batch.commit();
    console.log("✅ Matchs créés");

    console.log("\n🎯 Situation de test configurée :");
    console.log("   • Équipe 1 : 7 victoires");
    console.log("   • Équipe 2 : 6 victoires");
    console.log(
      "   • Match décisif en cours (Équipe 1 mène 2-0, 10-8 dans le 3ème set)"
    );
    console.log("   • 3 matchs en attente");
    console.log("\n📋 Instructions de test :");
    console.log(
      "   1. Allez sur http://localhost:5173/live-scoring-management"
    );
    console.log(
      "   2. Terminez le match décisif (ajoutez 1 point à l'équipe 1)"
    );
    console.log("   3. Vérifiez que :");
    console.log("      - L'équipe 1 passe à 8 victoires");
    console.log("      - La rencontre devient 'TERMINÉE'");
    console.log("      - Les matchs en attente sont annulés");
    console.log("      - L'interface change de couleur (rouge)");
  } catch (error) {
    console.error("❌ Erreur lors de la configuration du test :", error);
  }
}

// Exécuter le script
setupTestScoreAcquis()
  .then(() => {
    console.log("\n✅ Configuration terminée !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  });
