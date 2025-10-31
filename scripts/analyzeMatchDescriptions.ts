import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq",
  authDomain: "livescoring-sqyping.firebaseapp.com",
  projectId: "livescoring-sqyping",
  storageBucket: "livescoring-sqyping.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeMatchDescriptions() {
  try {
    console.log("🔍 Analyse des descriptions de match...");

    // Récupérer tous les matchs du tournoi TTE5679
    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, where("championshipId", "==", "TTE5679"));

    const querySnapshot = await getDocs(q);
    console.log(`📊 ${querySnapshot.docs.length} matchs trouvés`);

    let maxLength = 0;
    let longestDescription = "";
    let longestMatch: any = null;

    const descriptions: {
      length: number;
      description: string;
      matchId: string;
    }[] = [];

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const description = data.matchDesc || "";
      const length = description.length;

      descriptions.push({
        length,
        description,
        matchId: doc.id,
      });

      if (length > maxLength) {
        maxLength = length;
        longestDescription = description;
        longestMatch = data;
      }
    });

    // Trier par longueur décroissante
    descriptions.sort((a, b) => b.length - a.length);

    console.log("\n🏆 TOP 10 des descriptions les plus longues :");
    console.log("=".repeat(60));

    descriptions.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.length} caractères`);
      console.log(`   Match ID: ${item.matchId}`);
      console.log(`   Description: "${item.description}"`);
      console.log("-".repeat(60));
    });

    console.log(`\n📏 La plus longue description fait ${maxLength} caractères`);
    console.log(`📝 Description: "${longestDescription}"`);

    if (longestMatch) {
      console.log(`\n🎯 Détails du match avec la plus longue description :`);
      console.log(`   - Joueur 1: ${longestMatch.player1?.name || "N/A"}`);
      console.log(`   - Joueur 2: ${longestMatch.player2?.name || "N/A"}`);
      console.log(`   - Table: ${longestMatch.table || "N/A"}`);
      console.log(`   - Statut: ${longestMatch.status || "N/A"}`);
    }

    // Statistiques générales
    const totalLength = descriptions.reduce(
      (sum, item) => sum + item.length,
      0
    );
    const averageLength = totalLength / descriptions.length;

    console.log(`\n📊 Statistiques générales :`);
    console.log(
      `   - Longueur moyenne: ${averageLength.toFixed(2)} caractères`
    );
    console.log(`   - Longueur maximale: ${maxLength} caractères`);
    console.log(
      `   - Longueur minimale: ${Math.min(
        ...descriptions.map((d) => d.length)
      )} caractères`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse:", error);
  }
}

// Exécuter l'analyse
analyzeMatchDescriptions()
  .then(() => {
    console.log("\n✅ Analyse terminée !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });

