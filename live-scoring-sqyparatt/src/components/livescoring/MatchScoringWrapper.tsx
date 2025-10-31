// src/components/livescoring/MatchScoringWrapper.tsx
// Wrapper pour intégrer MatchScoreCard dans notre système

"use client";

import { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { MatchScoreCard } from "./MatchScoreCard";
import type { Match } from "@/types/livescoring";
import type { FirestoreMatch } from "@/types/firestore-match";
import type { LiveScoringMatch } from "@/lib/ittf/types";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MatchScoringWrapperProps {
  liveScoringMatch: LiveScoringMatch;
  onClose: () => void;
}

export function MatchScoringWrapper({
  liveScoringMatch,
  onClose,
}: MatchScoringWrapperProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firestoreId, setFirestoreId] = useState<string | null>(null);

  useEffect(() => {
    const initializeMatch = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si le match existe déjà dans Firestore, utiliser son ID et mettre à jour le statut
        if (liveScoringMatch.firestoreId) {
          setFirestoreId(liveScoringMatch.firestoreId);

          // Mettre à jour le statut à "inProgress" pour ce match existant
          try {
            const docRef = doc(db, "matches", liveScoringMatch.firestoreId);
            const updateData: any = { status: "inProgress" };

            // startTime sera défini quand l'utilisateur cliquera sur "Lancer"

            await updateDoc(docRef, updateData);
            console.log(
              `✅ Statut du match ${liveScoringMatch.firestoreId} mis à jour à "inProgress"`
            );
          } catch (err) {
            console.error("Erreur lors de la mise à jour du statut:", err);
          }

          return;
        }

        // Sinon, créer un nouveau match dans Firestore
        const firestoreMatchData: Omit<FirestoreMatch, "id"> = {
          ittfMatchId: liveScoringMatch.matchId,
          championshipId: "", // Sera défini plus tard
          date: "", // Sera défini plus tard
          table: parseInt(liveScoringMatch.table.replace("T", "")) || 0,
          eventKey: liveScoringMatch.event,
          matchDesc:
            liveScoringMatch.matchDesc ||
            liveScoringMatch.Desc ||
            liveScoringMatch.phase,
          scheduledTime: liveScoringMatch.scheduledTime || "",
          player1: {
            id: `player1_${liveScoringMatch.matchId}`,
            name: liveScoringMatch.team1.names[0] || "",
            teamId: liveScoringMatch.team1.countries[0] || "",
            encounterId: "",
            order: 1,
          },
          player2: {
            id: `player2_${liveScoringMatch.matchId}`,
            name: liveScoringMatch.team2.names[0] || "",
            teamId: liveScoringMatch.team2.countries[0] || "",
            encounterId: "",
            order: 2,
          },
          score: [],
          setsWon: { player1: 0, player2: 0 },
          matchNumber: 0,
          type: "single",
          status: "inProgress", // Match lancé = en cours
          // startTime sera défini quand l'utilisateur cliquera sur "Lancer"
          encounterId: "",
          order: 0,
        };

        // Créer le document dans Firestore
        const docRef = await addDoc(
          collection(db, "matches"),
          firestoreMatchData
        );
        const newId = docRef.id;
        setFirestoreId(newId);

        console.log(`✅ Match créé dans Firestore avec l'ID: ${newId}`);
      } catch (err) {
        console.error("Erreur lors de l'initialisation du match:", err);
        setError("Erreur lors de l'initialisation du match");
      } finally {
        setLoading(false);
      }
    };

    initializeMatch();
  }, [liveScoringMatch]);

  useEffect(() => {
    if (!firestoreId) return;

    // Convertir LiveScoringMatch vers Match pour MatchScoreCard
    const convertedMatch: Match = {
      id: firestoreId,
      player1: {
        id: `player1_${liveScoringMatch.matchId}`,
        name: liveScoringMatch.team1.names[0] || "",
        teamId: liveScoringMatch.team1.countries[0] || "",
        encounterId: "",
        order: 1,
      },
      player2: {
        id: `player2_${liveScoringMatch.matchId}`,
        name: liveScoringMatch.team2.names[0] || "",
        teamId: liveScoringMatch.team2.countries[0] || "",
        encounterId: "",
        order: 2,
      },
      score: [],
      setsWon: { player1: 0, player2: 0 },
      table: parseInt(liveScoringMatch.table.replace("T", "")) || 0,
      matchNumber: 0,
      type: "single",
      status: "waiting",
      // startTime sera défini quand l'utilisateur cliquera sur "Lancer"
      encounterId: "",
      order: 0,
      matchDesc:
        liveScoringMatch.matchDesc ||
        liveScoringMatch.Desc ||
        liveScoringMatch.phase ||
        "",
    };

    setMatch(convertedMatch);

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      doc(db, "matches", firestoreId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as FirestoreMatch;
          const updatedMatch: Match = {
            id: doc.id,
            player1: {
              id: data.player1.id || `player1_${doc.id}`,
              name: data.player1.name,
              teamId: data.player1.teamId,
              encounterId: data.encounterId || "",
              order: 1,
            },
            player2: {
              id: data.player2.id || `player2_${doc.id}`,
              name: data.player2.name,
              teamId: data.player2.teamId,
              encounterId: data.encounterId || "",
              order: 2,
            },
            score: data.score || [],
            setsWon: data.setsWon || { player1: 0, player2: 0 },
            table: data.table,
            matchNumber: data.matchNumber || 0,
            type: data.type || "single",
            status: data.status,
            startTime: data.startTime,
            encounterId: data.encounterId,
            order: data.order || 0,
            matchDesc: data.matchDesc || "",
          };
          setMatch(updatedMatch);
        }
      },
      (err) => {
        console.error("Erreur lors de l'écoute du match:", err);
        setError("Erreur lors du chargement du match");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestoreId, liveScoringMatch]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onClose}>
            Fermer
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!match) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onClose}>
            Fermer
          </Button>
        }
      >
        Match introuvable
      </Alert>
    );
  }

  return <MatchScoreCard match={match} onClose={onClose} />;
}
