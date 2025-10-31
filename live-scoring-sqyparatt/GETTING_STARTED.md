# Guide de Démarrage - SQYPARATT

## 🎯 Vue d'ensemble

**SQYPARATT** est une application Next.js 14 qui permet de suivre en temps réel les championnats de tennis de table para de l'ITTF. Elle partage le même projet Firebase que l'application `live-scoring`.

## 📋 Prérequis

- Node.js >= 18.17.0 (recommandé)
- npm ou yarn
- Accès au projet Firebase `sqyping-live-scoring`

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd live-scoring-sqyparatt
npm install
```

### 2. Configuration Firebase

Créer un fichier `.env.local` à la racine :

```env
# Firebase Configuration (même projet que live-scoring)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCkd01wVcbSAtUUkC0PqU6EGEl265ZovfY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sqyping-live-scoring.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sqyping-live-scoring
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sqyping-live-scoring.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=854663708748
NEXT_PUBLIC_FIREBASE_APP_ID=1:854663708748:web:becfaed2dc5b415746ab4e9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0NKBSNYRXP

# ITTF API Configuration
NEXT_PUBLIC_ITTF_API_BASE_URL=https://results.ittf.com/ittf-web-results/html
```

### 3. Lancer en mode développement

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

### 4. Build pour la production

```bash
npm run build
npm start
```

## 📱 Pages Disponibles

### Page d'accueil

- **URL**: `/`
- **Description**: Liste des championnats ITTF (actifs et terminés)
- **Fonctionnalités**:
  - Vue d'ensemble de tous les championnats
  - Distinction entre championnats en cours et terminés
  - Statistiques (nombre d'épreuves, jours, tables)

### Page Live

- **URL**: `/live`
- **Description**: Vue consolidée de tous les matchs en direct
- **Fonctionnalités**:
  - Affichage en temps réel des matchs en cours
  - Regroupement par championnat
  - Rafraîchissement automatique toutes les 10 secondes

### Page Championnat

- **URL**: `/championship/[champId]`
- **Exemple**: `/championship/TTE5679`
- **Fonctionnalités**:
  - Détails complets du championnat
  - Matchs en direct, à venir et terminés
  - Navigation par date
  - Liste des épreuves organisées par type

## 🔧 Architecture

### Structure des Dossiers

```
live-scoring-sqyparatt/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── layout.tsx         # Layout global
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── globals.css        # Styles globaux
│   │   ├── live/              # Page matchs en direct
│   │   └── championship/      # Pages de championnat
│   │
│   ├── components/            # Composants React
│   │   ├── ChampionshipCard.tsx  # Carte de championnat
│   │   ├── MatchCard.tsx         # Carte de match
│   │   ├── LoadingSpinner.tsx    # Indicateur de chargement
│   │   └── ErrorMessage.tsx      # Affichage d'erreurs
│   │
│   ├── hooks/                 # Hooks React personnalisés
│   │   ├── useChampionship.ts    # Gestion des championnats
│   │   ├── useMatchDay.ts        # Gestion des matchs
│   │   └── useGroupData.ts       # Gestion des groupes
│   │
│   └── lib/                   # Bibliothèques
│       ├── firebase.ts           # Configuration Firebase
│       └── ittf/                 # Module API ITTF
│           ├── types.ts          # Types TypeScript
│           ├── api.ts            # Fonctions d'API
│           ├── utils.ts          # Utilitaires
│           └── index.ts          # Exports
```

### Technologies Utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage strict (mode `strict`)
- **Tailwind CSS** - Styling utility-first
- **SWR** - Gestion du cache et des requêtes
- **Firebase** - Backend (Firestore, Auth, Storage)

## 🎨 API ITTF

### Endpoints Disponibles

```typescript
// Informations du championnat
fetchChampionship('TTE5679')
→ GET /html/TTE5679/champ.json

// Matchs d'une journée
fetchMatchDay('TTE5679', '2025-10-14')
→ GET /html/TTE5679/match/d2025-10-14.json

// Données de groupe
fetchGroupData('TTE5679', 'M.SINGLES----MS1----')
→ GET /html/TTE5679/groups/M.SINGLES----MS1----.json

// Tableau élimination directe
fetchDrawData('TTE5679', 'M.SINGLES----MS1----')
→ GET /html/TTE5679/draws/M.SINGLES----MS1----.json
```

### Exemple d'Utilisation

```typescript
import { fetchChampionship, useChampionship } from "@/lib/ittf";

// Dans un composant serveur
const championship = await fetchChampionship("TTE5679");

// Dans un composant client avec hook
function MyComponent() {
  const { championship, isLoading, error } = useChampionship("TTE5679");

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{championship.champDesc}</div>;
}
```

## 🔄 Rafraîchissement des Données

L'application utilise **SWR** pour la gestion du cache et le rafraîchissement automatique :

- **Championnats** : rafraîchis toutes les 60 secondes (si non terminés)
- **Matchs** : rafraîchis toutes les 30 secondes
- **Matchs live** : rafraîchis toutes les 10 secondes
- **Groupes** : rafraîchis toutes les 60 secondes

Ces intervalles sont configurables dans les hooks correspondants.

## 🎯 Prochaines Fonctionnalités

- [ ] Page de classements des groupes
- [ ] Page de tableaux d'élimination directe
- [ ] Profils détaillés des joueurs
- [ ] Statistiques avancées
- [ ] Notifications push pour les matchs favoris
- [ ] Mode sombre
- [ ] Export des résultats en PDF
- [ ] Filtres avancés (par pays, par classe, etc.)

## 🐛 Dépannage

### Problème : L'application ne démarre pas

**Solution** :

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Nettoyer le cache Next.js
rm -rf .next
npm run dev
```

### Problème : Erreur de connexion à Firebase

**Solution** : Vérifier que le fichier `.env.local` est bien configuré avec les bonnes clés.

### Problème : Pas de données ITTF

**Solution** : Vérifier que l'URL de l'API ITTF est accessible :

```bash
curl https://results.ittf.com/ittf-web-results/html/TTE5679/champ.json
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour la production
npm run start        # Démarrer le serveur production
npm run lint         # Vérifier le code avec ESLint
npm run type-check   # Vérifier les types TypeScript
```

## 🤝 Contribution

Cette application fait partie du projet **SQYPING** et utilise le même backend Firebase que l'application `live-scoring`.

Pour toute question ou suggestion, contactez l'équipe de développement.

## 📄 License

Propriétaire - SQYPING © 2025


