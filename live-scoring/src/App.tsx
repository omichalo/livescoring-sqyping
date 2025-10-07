import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { LiveOverlayPage } from "./pages/LiveOverlayPage";
import { OverlayTVPage } from "./pages/OverlayTVPage";
import { OverlayLogoPage } from "./pages/OverlayLogoPage";
import { MatchesListPage } from "./pages/MatchesListPage";
import { EncountersListPage } from "./pages/EncountersListPage";
import { EncounterFormPage } from "./pages/EncounterFormPage";
import { EncounterPreparationPage } from "./pages/EncounterPreparationPage";
import { LiveScoringManagementPage } from "./pages/LiveScoringManagementPage";
import {
  AppBar,
  Toolbar,
  Button,
  Stack,
  Box,
  Container,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Link } from "react-router-dom";
import { ScoreOverlay } from "./components/ScoreOverlay";
import { useFirestoreStatus } from "./hooks/useFirestoreStatus";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
// import { LoginPage } from "./pages/LoginPage"; // Fichier supprimé
import { OverlayClassicPage } from "./pages/OverlayClassicPage";
import { OverlayModernPage } from "./pages/OverlayModernPage";
import { OverlayMinimalPage } from "./pages/OverlayMinimalPage";
import { OverlaySportPage } from "./pages/OverlaySportPage";
import { OverlayElegantPage } from "./pages/OverlayElegantPage";
import { OverlayHorizontalPage } from "./pages/OverlayHorizontalPage";
import { OverlayDesignsPage } from "./pages/OverlayDesignsPage";
import { RequireAuth } from "./components/RequireAuth";

const HEADER_HEIGHT = 64; // valeur standard pour AppBar

const Header = () => {
  const isOffline = useNetworkStatus();
  const firestoreError = useFirestoreStatus();

  const showError = isOffline || firestoreError;
  const errorLabel = isOffline ? "Connexion perdue" : "Erreur Firestore";

  const ErrorIcon = isOffline ? WifiOffIcon : WarningAmberIcon;
  return (
    <AppBar position="fixed" sx={{ zIndex: 1100 }}>
      <Toolbar sx={{ height: HEADER_HEIGHT }}>
        <Stack direction="row" spacing={2}>
          <Button color="inherit" component={Link} to="/encounters/new">
            Étape 1: Rencontre
          </Button>
          <Button color="inherit" component={Link} to="/encounter-preparation">
            Étape 2: Préparation
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/live-scoring-management"
          >
            Étape 3: Gestion
          </Button>
          <Button color="inherit" component={Link} to="/encounters">
            Rencontres
          </Button>
        </Stack>
        {showError && (
          <Box
            sx={{
              bgcolor: "error.main",
              color: "common.white",
              px: 2,
              py: 0.5,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              boxShadow: 2,
            }}
          >
            <ErrorIcon sx={{ mr: 1, color: "common.white" }} />
            <Typography>{errorLabel}</Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
const AppContent = () => {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/overlay");

  return (
    <>
      {!hideHeader && <Header />}

      {/* Décalage du contenu pour compenser le header fixe */}
      <Box sx={{ mt: hideHeader ? 0 : `${HEADER_HEIGHT + 16}px` }}>
        <Container maxWidth={false}>
          <Routes>
            {/* <Route path="/login" element={<LoginPage />} /> */}
            <Route path="/overlay/score/:table" element={<ScoreOverlay />} />
            <Route
              path="/overlay/classic/:table"
              element={<OverlayClassicPage />}
            />
            <Route
              path="/overlay/modern/:table"
              element={<OverlayModernPage />}
            />
            <Route
              path="/overlay/minimal/:table"
              element={<OverlayMinimalPage />}
            />
            <Route
              path="/overlay/sport/:table"
              element={<OverlaySportPage />}
            />
            <Route
              path="/overlay/elegant/:table"
              element={<OverlayElegantPage />}
            />
            <Route
              path="/overlay/horizontal/:design/:table"
              element={<OverlayHorizontalPage />}
            />
            <Route
              path="/overlay/designs/:design/:table"
              element={<OverlayDesignsPage />}
            />
            <Route path="/overlay/logo" element={<OverlayLogoPage />} />
            <Route path="/overlay/tv/:table" element={<OverlayTVPage />} />
            <Route path="/overlay/:table" element={<LiveOverlayPage />} />
            <Route
              path="/overlay"
              element={<Navigate to="/overlay/1" replace />}
            />
            <Route
              path="/matches"
              element={
                <RequireAuth>
                  <MatchesListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/encounters/new"
              element={
                <RequireAuth>
                  <EncounterFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/encounters/:encounterId/edit"
              element={
                <RequireAuth>
                  <EncounterFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/encounters/:encounterId"
              element={
                <RequireAuth>
                  <EncounterFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/encounters"
              element={
                <RequireAuth>
                  <EncountersListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/encounter-preparation"
              element={
                <RequireAuth>
                  <EncounterPreparationPage />
                </RequireAuth>
              }
            />
            <Route
              path="/live-scoring-management"
              element={
                <RequireAuth>
                  <LiveScoringManagementPage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Navigate to="/live-scoring-management" replace />
                </RequireAuth>
              }
            />
          </Routes>
        </Container>
      </Box>
    </>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
