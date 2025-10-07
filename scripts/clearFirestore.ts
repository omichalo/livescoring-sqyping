import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

async function clearCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const batchSize = snapshot.size;

  if (batchSize === 0) {
    console.log(`ℹ️ Aucune donnée à supprimer dans "${collectionName}".`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(
    `🧹 ${batchSize} document(s) supprimé(s) de "${collectionName}".`
  );
}

async function clearAll() {
  await clearCollection("matches");
  await clearCollection("tables");
  console.log("✅ Toutes les données ont été purgées.");
}

clearAll().catch(console.error);
