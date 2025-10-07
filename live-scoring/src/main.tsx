import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  getTheme,
  ThemeProvider,
  CssBaseline,
} from "@omichalo/sqyping-mui-theme";
import { createTheme } from "@mui/material/styles";
import App from "./App.tsx";

const baseTheme = getTheme("light");

// Étendre le thème pour forcer la typographie partout
const theme = createTheme({
  ...baseTheme,
  typography: {
    ...baseTheme.typography,
    // Forcer la police sur tous les éléments
    allVariants: {
      fontFamily: baseTheme.typography.fontFamily,
    },
  },
  components: {
    ...baseTheme.components,
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: baseTheme.typography.fontFamily,
        },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
