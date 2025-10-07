import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { onSnapshot, collection, query, where } from "firebase/firestore";
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

    // Récupérer les équipes en temps réel
    const teamsQuery = query(collection(db, "teams"));
    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Team))
          .sort((a, b) => {
            // Trier par le champ 'order', puis par nom si pas d'order défini
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.name.localeCompare(b.name);
          });
        console.log("Équipes récupérées:", teamsData);
        setTeams(teamsData);
      },
      (error) => {
        console.error("Erreur lors de la récupération des équipes:", error);
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
      unsubscribeTeams();
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
