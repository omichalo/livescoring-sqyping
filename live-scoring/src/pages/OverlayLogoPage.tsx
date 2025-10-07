import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const OverlayLogoPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      bgcolor="transparent"
      sx={{ zIndex: 9999 }}
    >
      <Box
        sx={{
          width: 120,
          height: 140,
          background: theme.palette.primary.main,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1.5,
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            background: theme.palette.background.paper,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 1,
          }}
        >
          <img
            src="/sqyping.png"
            alt="Logo SQY Ping"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
