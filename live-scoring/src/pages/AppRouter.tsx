import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { PlayerFormPage } from "./PlayerFormPage";
import { PlayersListPage } from "./PlayersListePage";
// remplace ce chemin si besoin
import { AppBar, Toolbar, Button, Stack } from "@mui/material";
import { MatchesListPage } from "./MatchesListPage";
import { LiveOverlayPage } from "./LiveOverlayPage";
import { OverlayClassicPage } from "./OverlayClassicPage";
import { OverlayModernPage } from "./OverlayModernPage";
import { OverlayMinimalPage } from "./OverlayMinimalPage";
import { OverlaySportPage } from "./OverlaySportPage";
import { OverlayElegantPage } from "./OverlayElegantPage";
import { OverlayDemoPage } from "./OverlayDemoPage";
import OverlayComparisonPage from "./OverlayComparisonPage";
import { RequireAuth } from "../components/RequireAuth";
import { LoginPage } from "./LoginPage";
import { EncountersListPage } from "./EncountersListPage";
import { EncounterFormPage } from "./EncounterFormPage";
import { EncounterPreparationPage } from "./EncounterPreparationPage";
import { LiveScoringManagementPage } from "./LiveScoringManagementPage";

export const AppRouter = () => {
  const hideHeader =
    location.pathname.startsWith("/overlay") &&
    !location.pathname.includes("comparison");

  return (
    <Router>
      {!hideHeader && (
        <AppBar position="static">
          <Toolbar>
            <Stack direction="row" spacing={2}>
              <Button color="inherit" component={Link} to="/encounters/new">
                Étape 1: Rencontre
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/encounter-preparation"
              >
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
              <Button color="inherit" component={Link} to="/overlay-demo">
                Overlays
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
      )}
      <Routes>
        {/* Route de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées par authentification */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/live-scoring-management" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/players/new"
          element={
            <RequireAuth>
              <PlayerFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/players/:playerId"
          element={
            <RequireAuth>
              <PlayerFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/players"
          element={
            <RequireAuth>
              <PlayersListPage />
            </RequireAuth>
          }
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
          path="/overlay-demo"
          element={
            <RequireAuth>
              <OverlayDemoPage />
            </RequireAuth>
          }
        />
        <Route
          path="/overlay-comparison"
          element={
            <RequireAuth>
              <OverlayComparisonPage />
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

        {/* Routes d'overlay publiques (sans authentification) */}
        <Route path="/overlay/:table" element={<LiveOverlayPage />} />
        <Route
          path="/overlay/classic/:table"
          element={<OverlayClassicPage />}
        />
        <Route path="/overlay/modern/:table" element={<OverlayModernPage />} />
        <Route
          path="/overlay/minimal/:table"
          element={<OverlayMinimalPage />}
        />
        <Route path="/overlay/sport/:table" element={<OverlaySportPage />} />
        <Route
          path="/overlay/elegant/:table"
          element={<OverlayElegantPage />}
        />
      </Routes>
    </Router>
  );
};
