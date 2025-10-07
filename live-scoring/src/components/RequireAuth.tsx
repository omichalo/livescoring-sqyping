import { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  // Plus d'authentification requise - afficher directement les enfants
  return <>{children}</>;
};
