// src/components/LiveScoringPanel.tsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";
import { MatchScoreCard } from "./MatchScoreCard";
import { Typography, Box } from "@mui/material";

export const LiveScoringPanel: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snap) => {
      const data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Match))
        .filter((m) => m.status === "inProgress")
        .sort((a, b) => (a.table || 199) - (b.table || 99));
      setMatches(data);
    });

    return () => unsub();
  }, []);

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom align="center">
        Saisie des scores en direct
      </Typography>
      <Box
        display="flex"
        flexWrap="wrap"
        gap={3}
        justifyContent="center"
        alignItems="flex-start"
      >
        {matches.map((match) => (
          <Box
            key={match.id}
            sx={{
              flexBasis: { xs: "100%", sm: "100%", md: "48%", lg: "48%" },
              maxWidth: { xs: "100%", sm: "100%", md: "48%", lg: "48%" },
              minWidth: { xs: "100%", sm: "100%", md: "450px", lg: "450px" },
            }}
          >
            <MatchScoreCard match={match} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
