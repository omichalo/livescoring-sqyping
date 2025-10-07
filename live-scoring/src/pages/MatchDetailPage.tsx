import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { Typography, Box, CircularProgress } from "@mui/material";
import type { Match } from "../types";

export const MatchDetailPage = () => {
  const { id } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "matches", id), (snap) => {
      if (snap.exists()) {
        setMatch({ id: snap.id, ...snap.data() } as Match);
      } else {
        setMatch(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!match) return <Typography>Match introuvable.</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Fiche du match – Table {match.table}
      </Typography>
      <Typography>
        {match.player1.name} vs {match.player2.name}
      </Typography>
      <Typography mt={2}>
        Sets gagnés : {match.setsWon?.player1 ?? 0} –{" "}
        {match.setsWon?.player2 ?? 0}
      </Typography>
      <Typography mt={1}>
        Score :{" "}
        {match.score
          .map((set, idx) => `Set ${idx + 1}: ${set.player1}–${set.player2}`)
          .join(" | ")}
      </Typography>
    </Box>
  );
};
