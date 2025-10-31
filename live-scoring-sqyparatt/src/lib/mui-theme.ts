// src/lib/mui-theme.ts
// Thème Material-UI personnalisé pour l'application

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#3B82F6", // Bleu principal (compatible avec Tailwind)
      light: "#60A5FA",
      dark: "#1D4ED8",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#10B981", // Vert (compatible avec Tailwind)
      light: "#34D399",
      dark: "#059669",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
    },
    warning: {
      main: "#F59E0B",
      light: "#FBBF24",
      dark: "#D97706",
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626",
    },
    background: {
      default: "#F9FAFB", // Gris très clair
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827", // Gris foncé
      secondary: "#6B7280", // Gris moyen
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8, // Coins arrondis modernes
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          "&:hover": {
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Pas de majuscules automatiques
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});


