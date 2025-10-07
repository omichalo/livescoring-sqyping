import React, { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { keyframes } from "@mui/system";

type MatchInfo = {
  team1: string;
  team2: string;
  category: string;
};

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
`;

export const ScoreOverlay: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const theme = useTheme();
  const tableNumber = table || "35";
  const [info, setInfo] = useState<MatchInfo | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "scores", tableNumber),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (
            typeof data.team1 === "string" &&
            typeof data.team2 === "string" &&
            typeof data.category === "string"
          ) {
            setInfo(data as MatchInfo);
          }
        } else {
          setInfo(null);
        }
      }
    );
    return () => unsubscribe();
  }, [tableNumber]);

  if (!info) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        margin: 0,
        background: "transparent",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease-in-out",
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fontSize: { xs: "2em", md: "3em" },
          padding: { xs: "0.5em 1em", md: "1em 2em" },
          textAlign: "center",
          borderRadius: 3,
          border: `4px solid ${theme.palette.secondary.main}`,
          animation: `${fadeIn} 1s ease-in-out`,
          fontFamily: theme.typography.fontFamily,
          fontWeight: theme.typography.fontWeightBold,
          boxShadow: theme.shadows[12],
          minWidth: { xs: "90%", md: "auto" },
        }}
      >
        <Typography
          variant="h2"
          component="div"
          sx={{
            fontSize: "inherit",
            fontWeight: "inherit",
            fontFamily: "inherit",
            lineHeight: 1.2,
          }}
        >
          {info.team1} vs {info.team2}
        </Typography>
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontSize: "0.6em",
            fontWeight: "inherit",
            fontFamily: "inherit",
            opacity: 0.9,
            mt: 1,
          }}
        >
          {info.category}
        </Typography>
      </Paper>
    </Box>
  );
};
