#!/bin/bash

# Script de lancement de l'application SQYPARATT

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Charger la version Node.js spécifiée
nvm use

# Lancer l'application
npm run dev



