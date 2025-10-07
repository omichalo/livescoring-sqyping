import React, { useEffect, useState } from "react";
import { Box, Typography, Container } from "@mui/material";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { OverlayDesign } from "../components/OverlayDesign";
import type { Match, Team } from "../types";

const OverlayComparisonPage: React.FC = () => {
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le match en cours pour la table 1
        const matchesRef = collection(db, "matches");
        const matchesQuery = query(
          matchesRef,
          orderBy("tableNumber"),
          orderBy("matchNumber")
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesData = matchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Match[];

        const table1Matches = matchesData.filter(
          (m) => (m as Match & { tableNumber?: number }).tableNumber === 1
        );
        const currentMatch = table1Matches.find(
          (m) => m.status === "inProgress"
        );
        const upcoming = table1Matches
          .filter((m) => m.status === "waiting")
          .sort(
            (a, b) =>
              (a as Match & { matchNumber?: number }).matchNumber! -
              (b as Match & { matchNumber?: number }).matchNumber!
          )
          .slice(0, 2);

        setMatch(currentMatch || null);
        setUpcomingMatches(upcoming);

        // Récupérer les équipes
        const teamsRef = collection(db, "teams");
        const teamsSnapshot = await getDocs(teamsRef);
        const teamsData = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];
        setTeams(teamsData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  // Utiliser des données de démonstration si aucune donnée réelle n'est disponible
  const demoMatch =
    match ||
    (teams.length >= 2
      ? {
          id: "demo",
          tableNumber: 1,
          matchNumber: 1,
          status: "inProgress" as const,
          player1: { id: "p1", name: "Jean Dupont", teamId: teams[0].id },
          player2: { id: "p2", name: "Marie Martin", teamId: teams[1].id },
          score: [{ player1: 11, player2: 9 }],
          setsWon: { player1: 1, player2: 0 },
          startTime: Date.now(),
        }
      : null);

  const demoTeams = teams;

  const demoUpcomingMatches =
    upcomingMatches.length > 0
      ? upcomingMatches
      : [
          {
            id: "upcoming1",
            tableNumber: 1,
            matchNumber: 2,
            status: "waiting" as const,
            player1: { id: "p3", name: "Alice Martin", teamId: "team1" },
            player2: { id: "p4", name: "Bob Dupont", teamId: "team2" },
            score: [],
            setsWon: { player1: 0, player2: 0 },
            startTime: Date.now(),
          },
          {
            id: "upcoming2",
            tableNumber: 1,
            matchNumber: 3,
            status: "waiting" as const,
            player1: { id: "p5", name: "Claire Bernard", teamId: "team1" },
            player2: { id: "p6", name: "David Moreau", teamId: "team2" },
            score: [],
            setsWon: { player1: 0, player2: 0 },
            startTime: Date.now(),
          },
        ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        Comparaison des versions Overlay
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 4,
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Version avec match en cours */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Version avec match en cours
          </Typography>
          <Box sx={{ mb: 2 }}>
            <OverlayDesign
              designId="corporate"
              match={demoMatch}
              teams={demoTeams}
              upcomingMatches={[]}
              scale={0.8}
              hideLogo={true}
            />
          </Box>
        </Box>

        {/* Version avec prochains matchs */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Version avec prochains matchs
          </Typography>
          <Box sx={{ mb: 2 }}>
            <OverlayDesign
              designId="corporate"
              match={null}
              teams={demoTeams}
              upcomingMatches={demoUpcomingMatches}
              scale={0.8}
              hideLogo={true}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Informations de debug :
        </Typography>
        <Typography variant="body2">
          <strong>Match en cours :</strong>{" "}
          {match
            ? `${match.player1?.name} vs ${match.player2?.name}`
            : "Données de démonstration"}
        </Typography>
        <Typography variant="body2">
          <strong>Prochains matchs :</strong> {upcomingMatches.length} trouvés
          (réels) + données de démonstration
        </Typography>
        <Typography variant="body2">
          <strong>Équipes :</strong> {teams.length} trouvées (réelles) + données
          de démonstration
        </Typography>
      </Box>
    </Container>
  );
};

export default OverlayComparisonPage;
