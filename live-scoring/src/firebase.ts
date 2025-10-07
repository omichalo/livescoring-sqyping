// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkd01wVcbSAtUUkC0PqU6EGEl265ZovfY",
  authDomain: "sqyping-live-scoring.firebaseapp.com",
  projectId: "sqyping-live-scoring",
  storageBucket: "sqyping-live-scoring.firebasestorage.app",
  messagingSenderId: "854663708748",
  appId: "1:854663708748:web:becfaed2dc5b415746ab4e9",
  measurementId: "G-0NKBSNYRXP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
