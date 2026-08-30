/**
 * Composant iframe pour le mode FFTT
 */

"use client";

import { useState, useEffect } from "react";
import {
  getITTFIframeUrl,
  buildITTFUrl,
  getIframeHeight,
} from "@/lib/firebase-remote-config";

interface FFTTIframeProps {
  tableNumber: number;
  className?: string;
}

export function FFTTIframe({ tableNumber, className = "" }: FFTTIframeProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [iframeHeight, setIframeHeight] = useState<string>("450px");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        setIsLoading(true);
        setError(null);

        // Charger l'URL et la hauteur en parallèle
        const [baseUrl, height] = await Promise.all([
          getITTFIframeUrl(),
          getIframeHeight(),
        ]);

        const url = buildITTFUrl(baseUrl, tableNumber);
        setIframeUrl(url);
        setIframeHeight(height);
        console.log("📏 Configuration iframe chargée:", { url, height });
      } catch (err) {
        console.error(
          "Erreur lors du chargement de la configuration FFTT:",
          err
        );
        setError("Impossible de charger l'iframe FFTT");
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [tableNumber]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'iframe FFTT...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ minHeight: "400px" }}
      >
        <div className="text-center text-red-600">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  console.log("🔍 Rendu iframe:", { iframeHeight, iframeUrl, tableNumber });

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={iframeUrl}
        title={`FFTT Table ${tableNumber}`}
        className="w-full border-0"
        style={{ height: iframeHeight || "450px" }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
