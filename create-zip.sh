#!/usr/bin/env bash
# Crée une archive zip du projet en respectant l'ensemble des .gitignore
# Usage: ./create-zip.sh [fichier.zip] [-v]
#   -v : mode verbeux (affiche chaque fichier ajouté)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

OUTPUT="../livescoring-sqyping.zip"
VERBOSE=false
for arg in "$@"; do
  if [[ "$arg" == "-v" || "$arg" == "--verbose" ]]; then
    VERBOSE=true
  else
    OUTPUT="$arg"
  fi
done
# Chemin absolu de l'archive (toujours relatif au répertoire du script)
[[ "$OUTPUT" != /* ]] && OUTPUT="$(cd "$ROOT" && cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")"

LISTFILE=$(mktemp)
trap "rm -f '$LISTFILE'" EXIT

echo "Création de l'archive: $OUTPUT"

if git rev-parse --show-toplevel &>/dev/null; then
  echo "Utilisation des règles .gitignore (git)..."
  GIT_ROOT="$(git rev-parse --show-toplevel)"
  cd "$GIT_ROOT"
  # Fichiers suivis + fichiers non suivis mais non ignorés (respecte tous les .gitignore)
  (git ls-files; git ls-files --others --exclude-standard) 2>/dev/null | sort -u | while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    [[ "$f" == *.zip ]] && continue
    [[ "$f" == *"/create-zip.sh" ]] && continue
    echo "$f"
  done > "$LISTFILE"
  ZIP_CWD="$GIT_ROOT"
else
  echo "Pas de dépôt git : exclusion manuelle (node_modules, .git, out, dist, .next, .firebase, .env.local)..."
  find . -type f \
    ! -path "*node_modules*" \
    ! -path "*/.git/*" \
    ! -path "*/out/*" \
    ! -path "*/dist/*" \
    ! -path "*/.next/*" \
    ! -path "*/.firebase/*" \
    ! -name ".env.local" \
    ! -path "*/.env.local" \
    ! -name "*.zip" \
    ! -name "create-zip.sh" \
    -print > "$LISTFILE"
  ZIP_CWD="$ROOT"
fi

COUNT=$(wc -l < "$LISTFILE" | tr -d ' ')
echo "Fichiers à archiver: $COUNT"

rm -f "$OUTPUT"

cd "$ZIP_CWD"
if [[ "$VERBOSE" == true ]]; then
  echo "Ajout des fichiers (mode verbeux)..."
  zip -v -@ "$OUTPUT" < "$LISTFILE"
else
  echo "Création de l'archive..."
  zip -q -@ "$OUTPUT" < "$LISTFILE"
fi

echo "Terminé. Archive: $OUTPUT"
ls -lh "$OUTPUT"
