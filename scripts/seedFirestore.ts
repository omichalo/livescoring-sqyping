import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

const matches = [
  {
    player1: { name: "MICHALOWICZ Olivier", id: "p1", teamId: "team1" },
    player2: { name: "MARTIN Pierre", id: "p2", teamId: "team2" },
    score: [
      { player1: 11, player2: 7 },
      { player1: 9, player2: 11 },
      { player1: 11, player2: 8 },
    ],
    setsWon: { player1: 2, player2: 1 },
    tableNumber: 1,
    status: "inProgress",
    matchNumber: 1,
    scheduledAt: Timestamp.fromDate(new Date()),
  },
  {
    player1: { name: "DURAND Marie", id: "p3", teamId: "team1" },
    player2: { name: "LEMOINE Paul", id: "p4", teamId: "team2" },
    score: [
      { player1: 11, player2: 9 },
      { player1: 11, player2: 7 },
    ],
    setsWon: { player1: 2, player2: 0 },
    tableNumber: 2,
    status: "waiting",
    matchNumber: 2,
    scheduledAt: Timestamp.fromDate(new Date()),
  },
  {
    player1: { name: "BERNARD Sophie", id: "p5", teamId: "team1" },
    player2: { name: "PETIT Marc", id: "p6", teamId: "team2" },
    score: [],
    setsWon: { player1: 0, player2: 0 },
    tableNumber: 3,
    status: "waiting",
    matchNumber: 3,
    scheduledAt: Timestamp.fromDate(new Date()),
  },
  {
    player1: { name: "ROUSSEAU Claire", id: "p7", teamId: "team1" },
    player2: { name: "MOREAU Thomas", id: "p8", teamId: "team2" },
    score: [],
    setsWon: { player1: 0, player2: 0 },
    table: 4,
    status: "waiting",
    matchNumber: 4,
    scheduledAt: Timestamp.fromDate(new Date()),
  },
];

const teams = [
  { id: "team1", name: "SQY PING", matchesWon: 3 },
  { id: "team2", name: "PARIS 13 TT", matchesWon: 2 },
];

const tables = [
  { id: "table_1", name: "Table 1", currentMatchId: "match_001" },
  { id: "table_2", name: "Table 2", currentMatchId: "match_002" },
];

async function seed() {
  // Supprimer les anciennes équipes pour forcer la mise à jour
  try {
    const teamsSnapshot = await db.collection("teams").get();
    for (let doc of teamsSnapshot.docs) {
      await doc.ref.delete();
      console.log(`🗑️ Ancienne équipe ${doc.id} supprimée`);
    }
  } catch (error) {
    console.log("Aucune ancienne équipe à supprimer");
  }

  // Créer les matches avec les IDs originaux
  for (let i = 0; i < matches.length; i++) {
    const matchId = `match_00${i + 1}`;
    await db.collection("matches").doc(matchId).set(matches[i]);
    console.log(`✅ Match ${matchId} créé`);
  }

  // Créer le match avec l'ID "1" pour les overlays (utiliser le premier match qui est en cours)
  await db
    .collection("matches")
    .doc("1")
    .set({
      ...matches[0], // Utiliser le 1er match (DUPONT Jean vs MARTIN Pierre) qui est en cours
      id: "1",
      startTime: Date.now(),
    });
  console.log(`✅ Match 1 créé pour les overlays`);

  // Créer les autres matchs pour les prochains matchs
  for (let i = 2; i < matches.length; i++) {
    const matchId = `${i}`;
    await db.collection("matches").doc(matchId).set(matches[i]);
    console.log(`✅ Match ${matchId} créé pour les overlays`);
  }

  // Créer les équipes
  for (let team of teams) {
    await db.collection("teams").doc(team.id).set(team);
    console.log(`✅ Équipe ${team.name} créée`);
  }

  for (let t of tables) {
    await db.collection("tables").doc(t.id).set(t);
    console.log(`✅ Table ${t.name} créée`);
  }

  console.log("🎉 Données initiales insérées avec succès");
}

seed().catch(console.error);
