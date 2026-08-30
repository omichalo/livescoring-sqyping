/**
 * Composant client pour l'Overlay TV
 * Contient toute la logique interactive côté client
 */

import "./overlay-fonts.css";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentEncounter } from "@/hooks/useCurrentEncounter";

interface Player {
  id: string;
  name: string;
  teamId: string;
  encounterId: string;
  order?: number;
  country?: string;
  members?: Array<{ name: string; country: string }>;
}

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  score: { player1: number; player2: number }[];
  setsWon: { player1: number; player2: number };
  table?: number;
  matchNumber: number;
  type?: "single" | "double";
  status: "waiting" | "inProgress" | "finished" | "cancelled";
  startTime: number;
  encounterId?: string;
  order?: number;
}

interface OverlayTVClientProps {
  tableNumber: string;
}

export default function OverlayTVClient({ tableNumber }: OverlayTVClientProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { currentEncounter, isLoading: loadingEncounter } =
    useCurrentEncounter();

  // Fonction pour construire l'URL du drapeau
  const getFlagUrl = (countryCode: string) => {
    if (!countryCode) return "/placeholder-flag.svg";
    return `https://results.ittf.com/ittf-web-results/img/flags-v2/${countryCode}.png`;
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!tableNumber || !currentEncounter) {
      console.log("Pas de tableNumber ou currentEncounter:", {
        tableNumber,
        currentEncounter,
      });
      setMatch(null);
      return;
    }

    console.log("Recherche du match:", {
      tableNumber: parseInt(tableNumber),
      encounterId: currentEncounter.id,
    });

    // Chercher d'abord le match en cours sur cette table
    const activeMatchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", currentEncounter.id),
      where("status", "==", "inProgress"),
      where("table", "==", parseInt(tableNumber))
    );

    const unsubscribeActive = onSnapshot(
      activeMatchesQuery,
      (snapshot) => {
        console.log("Résultat de la requête match en cours:", {
          size: snapshot.size,
          docs: snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          })),
        });

        if (!snapshot.empty) {
          // Match en cours trouvé
          const matchDoc = snapshot.docs[0];
          const matchData = {
            id: matchDoc.id,
            ...matchDoc.data(),
          } as Match;
          console.log("Match en cours trouvé:", matchData);
          setMatch(matchData);
        } else {
          // Aucun match en cours, chercher le prochain match en attente
          console.log(
            "Aucun match en cours, recherche du prochain match en attente"
          );

          const waitingMatchesQuery = query(
            collection(db, "matches"),
            where("encounterId", "==", currentEncounter.id),
            where("status", "==", "waiting"),
            where("table", "==", parseInt(tableNumber))
          );

          const unsubscribeWaiting = onSnapshot(
            waitingMatchesQuery,
            (snapshot) => {
              console.log("Résultat de la requête matchs en attente:", {
                size: snapshot.size,
                docs: snapshot.docs.map((doc) => ({
                  id: doc.id,
                  data: doc.data(),
                })),
              });

              if (!snapshot.empty) {
                // Trier par heure de match (startTime) et prendre le premier
                const matches = snapshot.docs
                  .map(
                    (doc) =>
                      ({
                        id: doc.id,
                        ...doc.data(),
                      } as Match)
                  )
                  .sort((a, b) => a.startTime - b.startTime);

                const nextMatch = matches[0];
                console.log("Prochain match en attente trouvé:", nextMatch);
                setMatch(nextMatch);
              } else {
                console.log("Aucun match en attente sur cette table");
                setMatch(null);
              }
            },
            (error) => {
              console.error(
                "Erreur lors de la récupération des matchs en attente:",
                error
              );
            }
          );

          // Nettoyer l'écoute des matchs en attente quand on a un match en cours
          return () => unsubscribeWaiting();
        }
      },
      (error) => {
        console.error(
          "Erreur lors de la récupération du match en cours:",
          error
        );
      }
    );

    return () => unsubscribeActive();
  }, [tableNumber, currentEncounter]);

  if (!isClient || loadingEncounter) {
    return (
      <div className="fixed top-0 left-0 bg-transparent overlay-font">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!match) {
    // Aucun match (ni en cours ni en attente) - page complètement vide
    return null;
  }

  // Calculer les scores actuels (seulement si le match est en cours)
  const isMatchInProgress = match.status === "inProgress";
  const currentSet = isMatchInProgress
    ? match.score?.[match.score.length - 1] ?? { player1: 0, player2: 0 }
    : { player1: 0, player2: 0 };
  const setsWon = isMatchInProgress
    ? match.setsWon ?? { player1: 0, player2: 0 }
    : { player1: 0, player2: 0 };

  // Debug: vérifier la structure des données
  console.log("Structure du match:", {
    player1: match.player1,
    player2: match.player2,
    match: match,
  });

  return (
    <div className="fixed top-0 left-0 bg-transparent overlay-font">
      {/* Container principal avec dimensions fixes */}
      <div
        className={`${
          isMatchInProgress ? "w-[439px]" : "w-[501px]"
        } h-[90px] flex flex-col shadow-2xl`}
      >
        {/* Description du match - Au-dessus de tout */}
        <div className="w-[283px] h-[21px] bg-white flex items-center justify-center px-2 ml-[98px]">
          <div
            className="text-center match-description"
            style={{
              color: "#4659B5",
              fontSize: "10px !important",
              fontWeight: "bold",
            }}
          >
            {(match as any).matchDesc || "MATCH"}
          </div>
        </div>

        {/* Zone principale avec logo et scores */}
        <div className="flex w-full h-[69px]">
          {/* Logo ITTF - Côté gauche */}
          <div className="w-[98px] h-[69px] bg-white flex items-center justify-center p-2">
            <img
              src="/logo-ittf-world-para-elite.svg"
              alt="ITTF World Para Elite"
              className="w-11/12 h-11/12 object-contain"
            />
          </div>

          {/* Zone des noms */}
          <div className="w-[283px] h-[69px] flex flex-col">
            {(() => {
              // Détecter si c'est un double (par type OU par la présence de "/" dans le nom)
              const player1HasSlash = match.player1.name.includes("/");
              const player2HasSlash = match.player2.name.includes("/");
              const isDouble =
                match.type === "double" ||
                player1HasSlash ||
                player2HasSlash ||
                match.player1.members ||
                match.player2.members;

              if (isDouble) {
                // Affichage pour doubles : 2 lignes par équipe (total 4 lignes)
                // Extraire les noms des membres
                let player1Members: Array<{ name: string; country: string }>;
                if (match.player1.members && match.player1.members.length > 0) {
                  player1Members = match.player1.members;
                } else if (player1HasSlash) {
                  // Extraire les noms séparés par "/"
                  const names = match.player1.name
                    .split("/")
                    .map((n) => n.trim());
                  player1Members = names.map((name) => ({
                    name,
                    country: match.player1.teamId,
                  }));
                } else {
                  player1Members = [
                    { name: match.player1.name, country: match.player1.teamId },
                  ];
                }

                let player2Members: Array<{ name: string; country: string }>;
                if (match.player2.members && match.player2.members.length > 0) {
                  player2Members = match.player2.members;
                } else if (player2HasSlash) {
                  // Extraire les noms séparés par "/"
                  const names = match.player2.name
                    .split("/")
                    .map((n) => n.trim());
                  player2Members = names.map((name) => ({
                    name,
                    country: match.player2.teamId,
                  }));
                } else {
                  player2Members = [
                    { name: match.player2.name, country: match.player2.teamId },
                  ];
                }

                // Ajuster la hauteur des lignes pour 4 lignes au lieu de 2
                const lineHeight = "h-[17.25px]"; // 69px / 4 = 17.25px

                return (
                  <>
                    {/* Membre 1 de l'équipe 1 */}
                    <div
                      className={`${lineHeight} flex items-center px-4`}
                      style={{ backgroundColor: "#4659B5" }}
                    >
                      <div className="w-5 h-3 mr-2 flex">
                        <img
                          src={getFlagUrl(
                            player1Members[0]?.country || match.player1.teamId
                          )}
                          alt="Drapeau"
                          className="w-full h-full object-contain"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-flag.svg")
                          }
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-sm uppercase">
                        {player1Members[0]?.name || match.player1.name}
                      </div>
                    </div>

                    {/* Membre 2 de l'équipe 1 */}
                    <div
                      className={`${lineHeight} flex items-center px-4`}
                      style={{ backgroundColor: "#4659B5" }}
                    >
                      <div className="w-5 h-3 mr-2 flex">
                        <img
                          src={getFlagUrl(
                            player1Members[1]?.country || match.player1.teamId
                          )}
                          alt="Drapeau"
                          className="w-full h-full object-contain"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-flag.svg")
                          }
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-sm uppercase">
                        {player1Members[1]?.name || ""}
                      </div>
                    </div>

                    {/* Membre 1 de l'équipe 2 */}
                    <div
                      className={`${lineHeight} flex items-center px-4`}
                      style={{ backgroundColor: "#000000" }}
                    >
                      <div className="w-5 h-3 mr-2 flex">
                        <img
                          src={getFlagUrl(
                            player2Members[0]?.country || match.player2.teamId
                          )}
                          alt="Drapeau"
                          className="w-full h-full object-contain"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-flag.svg")
                          }
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-sm uppercase">
                        {player2Members[0]?.name || match.player2.name}
                      </div>
                    </div>

                    {/* Membre 2 de l'équipe 2 */}
                    <div
                      className={`${lineHeight} flex items-center px-4`}
                      style={{ backgroundColor: "#000000" }}
                    >
                      <div className="w-5 h-3 mr-2 flex">
                        <img
                          src={getFlagUrl(
                            player2Members[1]?.country || match.player2.teamId
                          )}
                          alt="Drapeau"
                          className="w-full h-full object-contain"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-flag.svg")
                          }
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-sm uppercase">
                        {player2Members[1]?.name || ""}
                      </div>
                    </div>
                  </>
                );
              } else {
                // Affichage normal pour simples : 1 ligne par équipe (total 2 lignes)
                return (
                  <>
                    {/* Joueur 1 - Ligne bleu-violet */}
                    <div
                      className="flex-1 flex items-center px-4 h-[33.5px]"
                      style={{ backgroundColor: "#4659B5" }}
                    >
                      <div className="w-6 h-4 mr-3 flex">
                        <img
                          src={getFlagUrl(match.player1.teamId || "")}
                          alt={`Drapeau ${match.player1.teamId || "inconnu"}`}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: "high-quality" as any }}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-flag.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-lg uppercase">
                        {match.player1.name}
                      </div>
                    </div>

                    {/* Ligne de séparation */}
                    <div className="h-[2px] bg-white w-[283px]"></div>

                    {/* Joueur 2 - Ligne noire */}
                    <div
                      className="flex-1 flex items-center px-4 h-[33.5px]"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <div className="w-6 h-4 mr-3 flex">
                        <img
                          src={getFlagUrl(match.player2.teamId || "")}
                          alt={`Drapeau ${match.player2.teamId || "inconnu"}`}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: "high-quality" as any }}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-flag.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 text-white font-medium text-lg uppercase">
                        {match.player2.name}
                      </div>
                    </div>
                  </>
                );
              }
            })()}
          </div>

          {/* Zone des scores ou "NEXT MATCH" - À droite */}
          <div
            className={`${
              isMatchInProgress ? "w-[58px]" : "w-[120px]"
            } h-[69px] flex flex-col`}
          >
            {isMatchInProgress ? (
              // Match en cours - afficher les scores
              (() => {
                // Détecter si c'est un double
                const player1HasSlash = match.player1.name.includes("/");
                const player2HasSlash = match.player2.name.includes("/");
                const isDouble =
                  match.type === "double" ||
                  player1HasSlash ||
                  player2HasSlash ||
                  match.player1.members ||
                  match.player2.members;

                if (isDouble) {
                  // Pour les doubles : scores fusionnés sur 2 lignes (pas de répétition)
                  return (
                    <>
                      {/* Scores Équipe 1 - Fusionnés sur 2 lignes */}
                      <div
                        className="h-[34.5px] flex items-center justify-center"
                        style={{ backgroundColor: "#4659B5" }}
                      >
                        <div className="flex items-center">
                          <div
                            className="bg-white flex items-center justify-center text-sm font-semibold"
                            style={{
                              width: "29px",
                              height: "34.5px",
                              color: "#000000",
                            }}
                          >
                            {setsWon.player1}
                          </div>
                          <div
                            className="text-white flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: "#4659B5",
                              width: "29px",
                              height: "34.5px",
                            }}
                          >
                            {currentSet.player1}
                          </div>
                        </div>
                      </div>
                      {/* Ligne vide pour membre 2 de l'équipe 1 */}
                      <div
                        className="h-[17.25px]"
                        style={{ backgroundColor: "#4659B5" }}
                      ></div>

                      {/* Scores Équipe 2 - Fusionnés sur 2 lignes */}
                      <div
                        className="h-[34.5px] flex items-center justify-center"
                        style={{ backgroundColor: "#000000" }}
                      >
                        <div className="flex items-center">
                          <div
                            className="bg-white flex items-center justify-center text-sm font-semibold"
                            style={{
                              width: "29px",
                              height: "34.5px",
                              color: "#000000",
                            }}
                          >
                            {setsWon.player2}
                          </div>
                          <div
                            className="text-white flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: "#000000",
                              width: "29px",
                              height: "34.5px",
                            }}
                          >
                            {currentSet.player2}
                          </div>
                        </div>
                      </div>
                      {/* Ligne vide pour membre 2 de l'équipe 2 */}
                      <div
                        className="h-[17.25px]"
                        style={{ backgroundColor: "#000000" }}
                      ></div>
                    </>
                  );
                } else {
                  // Pour les simples : scores normaux
                  return (
                    <>
                      {/* Scores Équipe 1 */}
                      <div
                        className="h-[33.5px] flex items-center justify-center"
                        style={{ backgroundColor: "#4659B5" }}
                      >
                        <div className="flex items-center">
                          <div
                            className="bg-white flex items-center justify-center text-xl font-semibold"
                            style={{
                              width: "29px",
                              height: "35px",
                              color: "#000000",
                            }}
                          >
                            {setsWon.player1}
                          </div>
                          <div
                            className="text-white flex items-center justify-center text-xl font-bold"
                            style={{
                              backgroundColor: "#4659B5",
                              width: "29px",
                              height: "35px",
                            }}
                          >
                            {currentSet.player1}
                          </div>
                        </div>
                      </div>

                      {/* Scores Équipe 2 */}
                      <div
                        className="h-[33.5px] flex items-center justify-center"
                        style={{ backgroundColor: "#000000" }}
                      >
                        <div className="flex items-center">
                          <div
                            className="bg-white flex items-center justify-center text-xl font-semibold"
                            style={{
                              width: "29px",
                              height: "35px",
                              color: "#000000",
                            }}
                          >
                            {setsWon.player2}
                          </div>
                          <div
                            className="text-white flex items-center justify-center text-xl font-bold"
                            style={{
                              backgroundColor: "#000000",
                              width: "29px",
                              height: "35px",
                            }}
                          >
                            {currentSet.player2}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                }
              })()
            ) : (
              // Match en attente - afficher "NEXT MATCH" et l'heure dans une seule cellule
              <div className="flex-1 flex flex-col items-center justify-center h-[69px] bg-white">
                <div
                  className="font-bold text-center next-match-text"
                  style={{ color: "#4659B5" }}
                >
                  NEXT MATCH
                </div>
                <div
                  className="font-bold text-center next-match-text mt-1"
                  style={{ color: "#4659B5" }}
                >
                  {(() => {
                    // Utiliser scheduledTime comme dans MatchListItem
                    const scheduledTime = (match as any).scheduledTime;
                    console.log("scheduledTime:", scheduledTime);

                    if (scheduledTime) {
                      // Si l'heure est déjà au format HH:MM, la retourner avec CET
                      if (scheduledTime.match(/^\d{2}:\d{2}$/)) {
                        return `${scheduledTime} CET`;
                      }
                      // Sinon, essayer d'extraire l'heure
                      const timeMatch = scheduledTime.match(/(\d{2}:\d{2})/);
                      if (timeMatch) {
                        return `${timeMatch[1]} CET`;
                      }
                      return scheduledTime;
                    }

                    // Fallback sur startTime si scheduledTime n'existe pas
                    return `${new Date(match.startTime).toLocaleTimeString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )} CET`;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
