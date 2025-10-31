/**
 * Carte d'affichage d'un championnat avec algorithme intelligent de statut
 */

import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { LocationOn, CalendarToday } from "@mui/icons-material";
import type { ITTFChampionship } from "@/lib/ittf";
import { formatDateShort } from "@/lib/ittf";
import { useSmartTournamentStatus } from "@/hooks/useSmartTournamentStatus";

interface ChampionshipCardProps {
  championship: ITTFChampionship;
  className?: string;
  liveMatchesCount?: number;
  upcomingMatchesCount?: number;
}

export function ChampionshipCard({
  championship,
  className = "",
  liveMatchesCount = 0,
  upcomingMatchesCount = 0,
}: ChampionshipCardProps) {
  const { champ, champDesc, location, dates } = championship;

  // Utiliser l'algorithme intelligent pour déterminer le statut
  const smartStatus = useSmartTournamentStatus({
    championship,
    liveMatchesCount,
    upcomingMatchesCount,
  });

  const startDate = dates[0]?.raw;
  const endDate = dates[dates.length - 1]?.raw;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "default";
      case "active":
        return "success";
      case "not_started":
        return "primary";
      default:
        return "warning";
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "finished":
        return "grey.400";
      case "active":
        return "success.main";
      case "not_started":
        return "primary.main";
      default:
        return "warning.main";
    }
  };

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderLeftColor: getBorderColor(smartStatus.smart),
        bgcolor:
          smartStatus.smart === "active" ? "success.50" : "background.paper",
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: 4,
        },
        ...(className && { className }),
      }}
    >
      <CardActionArea component={Link} href={`/championship/${champ}`}>
        <CardContent>
          {/* Badge de statut intelligent */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${smartStatus.emoji} ${smartStatus.label}`}
                color={getStatusColor(smartStatus.smart)}
                size="small"
                sx={{
                  animation:
                    smartStatus.smart === "active"
                      ? "pulse 2s infinite"
                      : "none",
                }}
              />

              {smartStatus.differsFromOfficial && (
                <Chip
                  label="⚠️ Diffère"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              fontFamily="monospace"
            >
              {champ}
            </Typography>
          </Box>

          {/* Titre */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {champDesc}
          </Typography>

          {/* Localisation */}
          <Box display="flex" alignItems="center" mb={2}>
            <LocationOn sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {location}
            </Typography>
          </Box>

          {/* Dates */}
          <Box display="flex" alignItems="center" mb={3}>
            <CalendarToday
              sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
            />
            <Typography variant="body2" color="text.secondary">
              {startDate && endDate && (
                <>
                  {formatDateShort(startDate)} - {formatDateShort(endDate)}
                </>
              )}
            </Typography>
          </Box>

          {/* Stats */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {championship.events.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Épreuves
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {dates.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Jours
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {championship.locations.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tables
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
