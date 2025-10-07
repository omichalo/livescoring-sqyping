# 🔒 Security Guidelines

## Firebase Credentials

### ⚠️ Service Account Key (NEVER COMMIT)

The file `scripts/serviceAccountKey.json` contains sensitive Firebase admin credentials.

**This file is already in `.gitignore` and should NEVER be committed to git.**

To set up the project:
1. Go to [Firebase Console](https://console.firebase.google.com/project/sqyping-live-scoring/settings/serviceaccounts/adminsdk)
2. Generate a new service account key
3. Download it and place it at `scripts/serviceAccountKey.json`

### ✅ Public Firebase Config (Safe to commit)

The Firebase config in `live-scoring/src/firebase.ts` contains public API keys that are:
- **Designed to be exposed** in frontend applications
- **Protected by Firebase Security Rules** (see `firestore.rules`)
- **Safe to commit** to version control

These keys identify your Firebase project but don't grant access without proper security rules.

## Environment Variables

If you need to add any sensitive configuration:
1. Create a `.env` or `.env.local` file (already in `.gitignore`)
2. Add your variables there
3. Reference them using `import.meta.env.VITE_*` in your code

## Deployment

Before deploying to production, ensure:
- [ ] `scripts/serviceAccountKey.json` is NOT in git history
- [ ] All `.env` files with secrets are in `.gitignore`
- [ ] Firebase Security Rules are properly configured
- [ ] Firebase project has proper authentication enabled
