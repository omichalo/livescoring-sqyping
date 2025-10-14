import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { onSnapshot, collection, query, where, doc } from "firebase/firestore";
import { db } from "../firebase";
import type { Match, Team } from "../types";
import { OverlayDesign } from "../components/OverlayDesign";
import { useCurrentEncounter } from "../hooks/useCurrentEncounter";

export const OverlayTVPage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const { currentEncounter } = useCurrentEncounter();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!table || !currentEncounter) return;

    // Chercher un match en cours sur cette table pour la rencontre active
    const matchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", currentEncounter.id),
      where("status", "==", "inProgress")
    );

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      // Trouver le match en cours pour cette table
      const tableMatch = matches.find((m) => m.table === parseInt(table));
      setMatch(tableMatch || null);
    });

    // Récupérer en temps réel les équipes de la rencontre en cours
    const unsubscribeTeam1 = onSnapshot(
      doc(db, "teams", currentEncounter.team1Id),
      (docSnap) => {
        if (docSnap.exists()) {
          const team1Data = { id: docSnap.id, ...docSnap.data() } as Team;
          setTeams((prevTeams) => {
            const team2 = prevTeams.find((t) => t.id === currentEncounter.team2Id);
            const newTeams = team2 ? [team1Data, team2] : [team1Data];
            // Trier par le champ 'order' pour garantir l'ordre correct
            newTeams.sort((a, b) => {
              const orderA = a.order ?? 999;
              const orderB = b.order ?? 999;
              return orderA - orderB;
            });
            return newTeams;
          });
        }
      },
      (error) => {
        console.error("Erreur lors de la récupération de l'équipe 1:", error);
      }
    );

    const unsubscribeTeam2 = onSnapshot(
      doc(db, "teams", currentEncounter.team2Id),
      (docSnap) => {
        if (docSnap.exists()) {
          const team2Data = { id: docSnap.id, ...docSnap.data() } as Team;
          setTeams((prevTeams) => {
            const team1 = prevTeams.find((t) => t.id === currentEncounter.team1Id);
            const newTeams = team1 ? [team1, team2Data] : [team2Data];
            // Trier par le champ 'order' pour garantir l'ordre correct
            newTeams.sort((a, b) => {
              const orderA = a.order ?? 999;
              const orderB = b.order ?? 999;
              return orderA - orderB;
            });
            return newTeams;
          });
        }
      },
      (error) => {
        console.error("Erreur lors de la récupération de l'équipe 2:", error);
      }
    );

    // Récupérer les 2 prochains matchs en attente pour la rencontre active
    const upcomingMatchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", currentEncounter.id),
      where("status", "==", "waiting")
      // Note: orderBy temporairement retiré en attendant l'index
    );

    const unsubscribeUpcoming = onSnapshot(
      upcomingMatchesQuery,
      (snapshot) => {
        const matchesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Match)
        );

        // Tri par matchNumber croissant et prendre les 2 premiers
        const sortedAndLimitedMatches = matchesData
          .sort((a, b) => a.matchNumber - b.matchNumber)
          .slice(0, 2);

        setUpcomingMatches(sortedAndLimitedMatches);
        console.log(
          "Prochains matchs (waiting, triés par matchNumber):",
          sortedAndLimitedMatches
        );
      },
      (error) => {
        console.error(
          "Erreur lors de la récupération des prochains matchs:",
          error
        );
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUpcoming();
      unsubscribeTeam1();
      unsubscribeTeam2();
    };
  }, [table, currentEncounter]);

  if (teams.length === 0) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor="transparent"
        sx={{ zIndex: 9999 }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          sx={{
            background: "rgba(0,0,0,0.8)",
            color: "white",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography>Chargement du match pour la table {table}...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      bgcolor="transparent"
      sx={{ zIndex: 9999 }}
    >
      <OverlayDesign
        designId="corporate"
        match={match}
        teams={teams}
        upcomingMatches={upcomingMatches}
        scale={1}
        hideLogo={true}
      />
    </Box>
  );
};
