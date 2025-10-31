/**
 * Script pour créer un build statique compatible avec Firebase Hosting
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔨 Building Next.js application...");

// Build Next.js
execSync("npm run build", { stdio: "inherit" });

console.log("📁 Copying files for static hosting...");

// Créer le dossier de sortie
const outDir = path.join(__dirname, "../out");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copier les fichiers statiques
const nextDir = path.join(__dirname, "../.next");
const staticDir = path.join(nextDir, "static");

if (fs.existsSync(staticDir)) {
  execSync(`cp -r ${staticDir} ${outDir}/_next`, { stdio: "inherit" });
}

// Créer un index.html simple qui charge l'application
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Live Scoring Overlay</title>
  <script>
    // Rediriger vers la page principale
    window.location.href = '/live-scoring';
  </script>
</head>
<body>
  <p>Redirection vers l'application...</p>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml);

console.log("✅ Static build completed!");

