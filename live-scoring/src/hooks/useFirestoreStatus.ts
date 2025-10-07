import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const useFirestoreStatus = () => {
  const [error, setError] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "matches"),
      () => {
        setError(false); // ✅ Firestore est accessible
        setCheckedOnce(true);
      },
      (err) => {
        console.error("Erreur Firestore onSnapshot:", err);
        setError(true); // ❌ Erreur réseau ou Firestore indisponible
        setCheckedOnce(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Ne rien afficher tant qu'on n’a pas fait le premier test
  return checkedOnce ? error : false;
};
