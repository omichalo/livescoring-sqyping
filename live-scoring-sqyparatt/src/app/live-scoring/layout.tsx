/**
 * Layout spécifique pour la page live-scoring (sans header/footer)
 * Ce layout remplace complètement le layout parent
 */

import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

// Force ce layout à être utilisé en exportant metadata
export const metadata = {
  title: "SQYPARATT - Live Scoring",
  description: "Live Scoring pour les championnats ITTF",
};

export default function LiveScoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div id="live-scoring-root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
