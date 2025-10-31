import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MUIProvider } from "@/components/MUIProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SQYPARATT - Live Scoring ITTF",
  description: "Suivi en direct des championnats de tennis de table para",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <MUIProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        SQYPARATT
                      </h1>
                      <p className="text-xs text-gray-500">Live Scoring ITTF</p>
                    </div>
                  </div>

                  <nav className="hidden md:flex space-x-6">
                    <a
                      href="/"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Accueil
                    </a>
                    <a
                      href="/live"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      En Direct
                    </a>
                    <a
                      href="/live-scoring"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Live Scoring
                    </a>
                    <a
                      href="/load-matches"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Charger Matchs
                    </a>
                    <a
                      href="/encounters"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Encounters
                    </a>
                    <a
                      href="/championships"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Championnats
                    </a>
                  </nav>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-500 text-sm">
                  <p>
                    © {new Date().getFullYear()} SQYPARATT - Données fournies
                    par l'ITTF
                  </p>
                  <p className="mt-2">
                    Application de suivi des championnats de tennis de table
                    para
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </MUIProvider>
      </body>
    </html>
  );
}
