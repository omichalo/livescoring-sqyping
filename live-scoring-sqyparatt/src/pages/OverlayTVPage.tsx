// Migration de src/app/overlay/tv/[tableNumber]/page.tsx vers Vite
import React from "react";
import { useParams } from "react-router-dom";
import OverlayTVClient from "../app/overlay/tv/[tableNumber]/OverlayTVClient";

const OverlayTVPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>();

  if (!tableNumber) {
    return <div>Table number not found</div>;
  }

  return <OverlayTVClient tableNumber={tableNumber} />;
};

export default OverlayTVPage;
