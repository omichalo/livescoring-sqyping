#!/bin/bash

# Script de développement local avec hot reload
echo "🚀 Démarrage du serveur de développement local..."

# Démarrer Vite en mode développement avec hot reload
echo "📦 Démarrage de Vite dev server..."
npm run dev:host &

# Attendre que Vite soit prêt
sleep 3

echo "✅ Serveur de développement démarré !"
echo "🌐 Application disponible sur : http://localhost:5173"
echo "📱 Accessible depuis d'autres appareils sur le réseau local"
echo "🔧 Port de développement : 5173 (Vite dev server)"
echo ""
echo "💡 Pour arrêter le serveur, appuyez sur Ctrl+C"
echo "🔄 Les modifications sont appliquées en temps réel"

# Garder le script actif
wait
