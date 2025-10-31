# SQYPARATT - Live Scoring ITTF

Application Next.js pour le suivi en direct des championnats de tennis de table para ITTF.

## 🚀 Démarrage

### Installation

```bash
cd live-scoring-sqyparatt
npm install
```

### Configuration

Créer un fichier `.env.local` à la racine du projet :

```env
# Firebase (même projet que live-scoring)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sqyping-live-scoring
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ITTF API
NEXT_PUBLIC_ITTF_API_BASE_URL=https://results.ittf.com/ittf-web-results/html
```

### Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
npm run build
npm start
```

## 📁 Structure du Projet

```
live-scoring-sqyparatt/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── live/              # Page matchs en direct
│   │   └── championship/      # Pages de championnat
│   │
│   ├── components/            # Composants React réutilisables
│   │   ├── ChampionshipCard.tsx
│   │   ├── MatchCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   │
│   ├── hooks/                 # Hooks React personnalisés
│   │   ├── useChampionship.ts
│   │   ├── useMatchDay.ts
│   │   └── useGroupData.ts
│   │
│   └── lib/                   # Bibliothèques et utilitaires
│       ├── firebase.ts        # Configuration Firebase
│       └── ittf/              # Module ITTF
│           ├── types.ts       # Types TypeScript
│           ├── api.ts         # Fonctions API
│           ├── utils.ts       # Utilitaires
│           └── index.ts       # Export central
│
├── public/                    # Fichiers statiques
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

## 🔧 Technologies Utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage strict
- **Tailwind CSS** - Framework CSS utility-first
- **SWR** - Gestion du cache et des requêtes
- **Firebase** - Backend (partagé avec live-scoring)
- **API ITTF** - Données des championnats

## 📚 Fonctionnalités

### Implémentées

- ✅ Liste des championnats ITTF
- ✅ Vue détaillée d'un championnat
- ✅ Matchs en direct
- ✅ Matchs à venir et terminés
- ✅ Actualisation automatique
- ✅ Filtrage par date
- ✅ Responsive design

### À venir

- ⏳ Classements des groupes
- ⏳ Tableaux d'élimination directe
- ⏳ Profils des joueurs
- ⏳ Statistiques avancées
- ⏳ Notifications push
- ⏳ Mode sombre
- ⏳ Favoris et alertes personnalisées

## 🎨 API ITTF

### Endpoints Utilisés

```typescript
// Championnat
GET /html/{champId}/champ.json

// Matchs d'une journée
GET /html/{champId}/match/d{YYYY-MM-DD}.json

// Données de groupe
GET /html/{champId}/groups/{eventKey}.json

// Tableau élimination directe
GET /html/{champId}/draws/{eventKey}.json
```

### Exemple d'Utilisation

```typescript
import { fetchChampionship, fetchMatchDay } from "@/lib/ittf";

// Récupérer un championnat
const championship = await fetchChampionship("TTE5679");

// Récupérer les matchs du jour
const matches = await fetchMatchDay("TTE5679", "2025-10-14");
```

## 🎯 Hooks Personnalisés

### `useChampionship`

```typescript
const { championship, isLoading, error, refresh } = useChampionship("TTE5679");
```

### `useMatchDay`

```typescript
const { liveMatches, upcomingMatches, finishedMatches } = useMatchDay(
  "TTE5679",
  "2025-10-14"
);
```

### `useLiveMatches`

```typescript
const { liveMatches, hasLiveMatches } = useLiveMatches("TTE5679");
```

## 🔐 Firebase

L'application utilise le même projet Firebase que `live-scoring` :

- **Project ID**: `sqyping-live-scoring`
- **Collections**: `encounters`, `matches`, `players`, `teams`, `ittfChampionships`

## 📝 Scripts

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
```

## 🤝 Contribution

Cette application fait partie du projet SQYPING et partage le backend Firebase avec l'application `live-scoring`.

## 📄 License

Propriétaire - SQYPING © 2025


