/**
 * Composant iframe pour le mode FFTT / ITTF.
 * L'appli embarquée ne supporte pas le refresh : on évite tout remount
 * et on n'écrit `src` que lorsque l'URL change réellement.
 */

"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  getITTFIframeUrl,
  buildITTFUrl,
  getIframeHeight,
} from "@/lib/firebase-remote-config";

interface FFTTIframeProps {
  tableNumber: number;
  className?: string;
}

function FFTTIframeComponent({
  tableNumber,
  className = "",
}: FFTTIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedSrcRef = useRef<string>("");
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [iframeHeight, setIframeHeight] = useState<string>("450px");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        setError(null);

        const [baseUrl, height] = await Promise.all([
          getITTFIframeUrl(),
          getIframeHeight(),
        ]);

        if (cancelled) return;

        const url = buildITTFUrl(baseUrl, tableNumber);
        setIframeUrl((prev) => (prev === url ? prev : url));
        setIframeHeight((prev) => (prev === height ? prev : height));
        console.log("📏 Configuration iframe chargée:", { url, height });
      } catch (err) {
        console.error(
          "Erreur lors du chargement de la configuration FFTT:",
          err
        );
        if (!cancelled) {
          setError("Impossible de charger l'iframe FFTT");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [tableNumber]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeUrl) return;
    if (loadedSrcRef.current === iframeUrl) return;

    iframe.src = iframeUrl;
    loadedSrcRef.current = iframeUrl;
  }, [iframeUrl]);

  if (isLoading && !iframeUrl) {
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

  if (error && !iframeUrl) {
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

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        title={`FFTT Table ${tableNumber}`}
        className="w-full border-0"
        style={{ height: iframeHeight || "450px" }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

export const FFTTIframe = memo(FFTTIframeComponent);
