import React from "react";
import { Routes, Route } from "react-router-dom";
import { MUIProvider } from "./components/MUIProvider";

// Import des pages
import LiveScoringPage from "./pages/LiveScoringPage";
import AdminPage from "./pages/AdminPage";
import EncountersPage from "./pages/EncountersPage";
import LivePage from "./pages/LivePage";
import LoadMatchesPage from "./pages/LoadMatchesPage";
import OverlayTVPage from "./pages/OverlayTVPage";
import MilestonesPage from "./pages/MilestonesPage";

function App() {
  return (
    <MUIProvider>
      <Routes>
        <Route path="/" element={<LiveScoringPage />} />
        <Route path="/live-scoring" element={<LiveScoringPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/encounters" element={<EncountersPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/load-matches" element={<LoadMatchesPage />} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/overlay/tv/:tableNumber" element={<OverlayTVPage />} />
      </Routes>
    </MUIProvider>
  );
}

export default App;
