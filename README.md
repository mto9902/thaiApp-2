# Keystone Languages Frontend

This repository is the **Expo / React Native client** for the Keystone app family.

It currently powers:

- the **mobile app** (primarily Android-tested)
- the **desktop web app** (React Native Web with dedicated `.web.tsx` screens)
- the **static marketing website** in `/website`

The active product in the app is primarily **Keystone Thai**, with Keystone Japanese and Keystone Korean represented in the product/marketing structure.

## What Keystone Is

Keystone is a **grammar-first language learning platform**.

The learning loop is:

1. choose one grammar structure
2. read an explanation and inspect a sentence
3. hear the sentence
4. analyze translation and word breakdown
5. practice the same pattern through focused exercise types like:
   - study
   - choose
   - build
   - match

The app is meant to feel structured, flat, minimal, and focused on language patterns rather than flashy gamification.

## Repo Structure

Main folders:

- `/app`
  - Expo Router screens
- `/src`
  - shared components, hooks, data, utils, providers
- `/android`
  - native Android project
- `/website`
  - standalone marketing site (HTML/CSS/JS)
- `/scripts`
  - helper scripts, including grammar CSV export

Important note:

- the backend does **not** live in this repo
- backend path is the sibling repo:
  - `C:\Users\Lux\thai-generator\ai-server`

## Quick Start (Full Stack)

### 1. Start the backend

From the sibling backend repo:

```powershell
cd C:\Users\Lux\thai-generator\ai-server
npm install
node .\server.js
```

If you use PM2 on a server:

```bash
pm2 restart server --update-env
```

### 2. Point the frontend at the correct backend

Frontend API base is currently hardcoded in:

- [src/config.ts](/C:/Users/Lux/thai-generator/thaiApp-2/src/config.ts)

Current value may point to EC2. For local full-stack work, change it to your local backend, for example:

```ts
export const API_BASE = "http://localhost:3000";
```

### 3. Set frontend env values

Frontend env file:

- [/.env](/C:/Users/Lux/thai-generator/thaiApp-2/.env)

Important frontend envs include:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI`
- `EXPO_PUBLIC_RC_ANDROID_API_KEY`
- `EXPO_PUBLIC_RC_IOS_API_KEY`
- `EXPO_PUBLIC_RC_ENTITLEMENT_ID`

### 4. Run the frontend

```powershell
cd C:\Users\Lux\thai-generator\thaiApp-2
npm install
npx expo start
```

Useful variants:

```powershell
npm run web
npx expo run:android --device
```

## How Frontend Connects To Backend

The frontend depends on the backend for most real functionality, including:

- auth
- grammar progress
- vocab review / SRS
- bookmarks
- admin console
- grammar overrides
- premium sync
- Google TTS sentence audio

Important runtime providers:

- [app/_layout.tsx](/C:/Users/Lux/thai-generator/thaiApp-2/app/_layout.tsx)
- [src/subscription/SubscriptionProvider.tsx](/C:/Users/Lux/thai-generator/thaiApp-2/src/subscription/SubscriptionProvider.tsx)
- [src/grammar/GrammarCatalogProvider.tsx](/C:/Users/Lux/thai-generator/thaiApp-2/src/grammar/GrammarCatalogProvider.tsx)

## Backend Architecture At A Glance

Backend repo:

- `C:\Users\Lux\thai-generator\ai-server`

Important backend files:

- `server.js`
  - main Express app
  - auth/account/premium sync
  - grammar progress
  - bookmarks
  - admin APIs
  - TTS
  - grammar overrides
  - startup migrations
- `srs.js`
  - vocab review / spaced repetition
  - heatmap/activity APIs
- `transform.js`
  - AI-generated grammar transform exercise API
- `db.js`
  - PostgreSQL connection pool

Database:

- PostgreSQL via `pg`
- explicit pooled connections with queueing
- main tables/concepts:
  - `users`
  - `user_preferences`
  - `grammar_progress`
  - `user_vocab`
  - `review_queue`
  - `review_sessions`
  - `activity_log`

Main backend API groups:

- auth: `/signup`, `/login`, `/auth/google`
- account: `/me`, `/me/keystone-access`
- preferences: `/user/preferences`
- grammar progress: `/grammar/progress*`
- bookmarks: `/bookmark`, `/bookmarks`
- admin: `/admin/dashboard`, `/admin/grammar*`
- vocab/SRS: `/vocab/review`, `/vocab/answer`, `/vocab/stats`, `/vocab/heatmap`
- content/audio: `/practice-csv`, `/grammar/overrides`, `/transform`, `/tts/sentence`
- health: `/health`

For the full backend/server/database/API breakdown, read:

- [AGENTS.md](/C:/Users/Lux/thai-generator/thaiApp-2/AGENTS.md)
- [PROJECT_CONTEXT.md](/C:/Users/Lux/thai-generator/thaiApp-2/PROJECT_CONTEXT.md)

## Env Setup

### Frontend

Frontend env lives in:

- [/.env](/C:/Users/Lux/thai-generator/thaiApp-2/.env)

This controls:

- Google sign-in IDs
- Google web redirect
- RevenueCat mobile keys
- entitlement ID

### Backend

Backend env lives in the sibling repo:

- `C:\Users\Lux\thai-generator\ai-server\.env`

Important backend envs include:

- DB credentials
- `ADMIN_EMAILS`
- `GOOGLE_APPLICATION_CREDENTIALS`
- TTS cache / pool tuning envs

## Important Behavior Notes

### Premium / Keystone Access

- native uses RevenueCat
- web does **not** read RevenueCat directly
- web reads backend account state from `/me`
- backend shared flag is `has_keystone_access`

If premium works on mobile but not web, check backend sync before changing frontend UI.

### Grammar lesson content

Bundled grammar defaults live in:

- [src/data/grammar.ts](/C:/Users/Lux/thai-generator/thaiApp-2/src/data/grammar.ts)

Live admin edits are merged from backend overrides at runtime through:

- [src/grammar/GrammarCatalogProvider.tsx](/C:/Users/Lux/thai-generator/thaiApp-2/src/grammar/GrammarCatalogProvider.tsx)

### Website

The `/website` folder exists for:

- marketing
- product landing pages
- legal/privacy/terms pages
- broader web presence / app-store-style compliance support

It is separate from Expo.

## Deployment Notes

These matter because production issues have already happened here.

Backend deployments must include:

- `/tts/sentence`
- `/me/keystone-access`
- `/grammar/overrides`

After pulling backend changes on EC2/server:

```bash
npm install
pm2 restart server --update-env
```

Always verify:

- backend `.env` exists and is correct
- Google TTS credentials file exists if TTS is enabled
- health endpoint responds:

```bash
curl http://localhost:3000/health
```

If premium sync is broken:

- confirm `/me/keystone-access` exists on the deployed backend

If Google TTS falls back to local speech:

- confirm `/tts/sentence` exists
- confirm backend credentials are valid
- check backend logs before changing the frontend

## Useful Commands

Frontend:

```powershell
npm run lint
npm run web
npx expo run:android --device
```

Frontend helper:

```powershell
node .\scripts\exportA1GrammarCsvs.mjs
```

Backend helper:

```powershell
cd ..\ai-server
node .\scripts\seedShowcaseUser.mjs
```

## Read Next

For detailed agent handoff context, read:

- [AGENTS.md](/C:/Users/Lux/thai-generator/thaiApp-2/AGENTS.md)
- [PROJECT_CONTEXT.md](/C:/Users/Lux/thai-generator/thaiApp-2/PROJECT_CONTEXT.md)
