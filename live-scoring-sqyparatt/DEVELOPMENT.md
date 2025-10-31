# Guide de Développement Local

## 🚀 Développement en Temps Réel (Recommandé)

Pour le développement avec hot reload et mise à jour automatique :

```bash
# Option 1: Script automatique
./dev-local.sh

# Option 2: Commande directe
npm run dev:host
```

**Avantages :**

- ✅ Hot reload automatique
- ✅ Mise à jour instantanée des modifications
- ✅ Accessible depuis d'autres appareils sur le réseau local
- ✅ Débogage facilité avec les DevTools

**URL :** http://localhost:5173 (port fixe)

## 🏗️ Déploiement Local avec Build

Pour tester la version de production localement :

```bash
# Option 1: Script automatique
./serve-local.sh

# Option 2: Commandes manuelles
npm run build
npm run serve:local
```

**Avantages :**

- ✅ Version identique à la production
- ✅ Test des optimisations de build
- ✅ Accessible depuis d'autres appareils sur le réseau local

**URL :** http://localhost:5002 (port fixe)

## 📱 Accès Réseau Local

Les deux modes permettent l'accès depuis d'autres appareils sur le même réseau :

1. Trouve l'IP de ton Mac : `ifconfig | grep "inet "`
2. Accède depuis un autre appareil : `http://[IP]:5173` ou `http://[IP]:5002`

## 🔧 Commandes Disponibles

```bash
# Développement
npm run dev              # Vite dev server (localhost seulement)
npm run dev:host         # Vite dev server (réseau local)

# Build et Preview
npm run build            # Construction de production
npm run preview          # Preview du build (localhost seulement)
npm run preview:host     # Preview du build (réseau local)

# Firebase Local
npm run serve:local      # Firebase Hosting local
npm run deploy:local     # Build + Firebase Hosting local

# Scripts automatiques
./dev-local.sh           # Développement avec hot reload
./serve-local.sh         # Déploiement local avec build
```

## 🎯 Recommandations

- **Pour le développement quotidien** : Utilise `./dev-local.sh`
- **Pour tester avant déploiement** : Utilise `./serve-local.sh`
- **Pour le déploiement en production** : Utilise `firebase deploy --only hosting:live-scoring-sqyparatt`

## 🔄 Workflow Recommandé

1. **Développement** : `./dev-local.sh`
2. **Test local** : `./serve-local.sh`
3. **Déploiement** : `firebase deploy --only hosting:live-scoring-sqyparatt`
