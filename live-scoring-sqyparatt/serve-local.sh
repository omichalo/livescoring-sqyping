#!/bin/bash

# Script de déploiement local avec build
echo "🔨 Construction de l'application..."

# Build de l'application
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi !"
    
    # Vérifier si le port 8080 est disponible
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Erreur : Le port 8080 est déjà utilisé par un autre processus"
        echo "💡 Arrêtez le processus qui utilise le port 8080 ou modifiez le script"
        echo "🔍 Pour voir quel processus utilise le port : lsof -i :8080"
        exit 1
    fi
    
    echo "🚀 Démarrage du serveur local Firebase sur le port 8080..."
    
    # Démarrer Firebase Hosting local sur le port 8080 avec accès réseau
    firebase serve --only hosting --config firebase.local.json --port 8080 --host 0.0.0.0
    
    echo "✅ Serveur local démarré !"
    echo "🌐 Application disponible sur : http://localhost:8080"
    echo "📱 Accessible depuis d'autres appareils sur le réseau local : http://192.168.0.169:8080"
    echo ""
    echo "💡 Pour arrêter le serveur, appuyez sur Ctrl+C"
    echo "🔄 Pour mettre à jour, relancez ce script après modification"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
