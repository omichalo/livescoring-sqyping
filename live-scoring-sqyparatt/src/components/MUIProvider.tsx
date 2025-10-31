// src/components/MUIProvider.tsx
// Provider Material-UI pour l'application

"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "@/lib/mui-theme";

interface MUIProviderProps {
  children: React.ReactNode;
}

export function MUIProvider({ children }: MUIProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}


