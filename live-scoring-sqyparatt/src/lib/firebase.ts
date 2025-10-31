/**
 * Configuration Firebase partagée avec l'application live-scoring
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Configuration Firebase (même projet que live-scoring)
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCkd01wVcbSAtUUkC0PqU6EGEl265ZovfY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "sqyping-live-scoring.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sqyping-live-scoring",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "sqyping-live-scoring.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "854663708748",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:854663708748:web:becfaed2dc5b415746ab4e9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0NKBSNYRXP",
};

// Initialisation Firebase (évite les réinitialisations multiples)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

// Types pour les collections Firestore
export interface FirestoreCollections {
  encounters: string;
  matches: string;
  players: string;
  teams: string;
  ittfChampionships: string; // Nouvelle collection pour les championnats ITTF
}

export const COLLECTIONS: FirestoreCollections = {
  encounters: "encounters",
  matches: "matches",
  players: "players",
  teams: "teams",
  ittfChampionships: "ittfChampionships",
};
