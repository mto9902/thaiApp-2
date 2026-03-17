# AGENTS.md

This file is for a fresh coding agent entering `C:\Users\Lux\thai-generator\thaiApp-2`.
Read this before making assumptions.

## 1. What This Repo Is

This repository is the **Expo / React Native client** for the Keystone app family.

It currently contains three distinct code surfaces:

1. **Mobile app + desktop web app**
   - Expo Router app in `/app`
   - shared logic/components in `/src`
   - Android native project in `/android`

2. **Static marketing website**
   - plain HTML/CSS/JS in `/website`
   - no React, no bundler, no build step

3. **A hard dependency on a sibling backend repo**
   - backend is **not inside this repo**
   - sibling path: `C:\Users\Lux\thai-generator\ai-server`
   - the frontend talks to that backend through a hardcoded API base

## 2. The First Files To Read

If you are newly dropped into this repo, read these in roughly this order:

1. `/src/config.ts`
   - shows the live backend base URL
   - currently hardcoded to the EC2 server

2. `/app/_layout.tsx`
   - shows the root provider stack
   - important providers:
     - `SubscriptionProvider`
     - `GrammarCatalogProvider`

3. `/src/subscription/SubscriptionProvider.tsx`
   - the premium / Keystone Access truth flow
   - this file is critical because web and native do **not** behave the same

4. `/src/grammar/GrammarCatalogProvider.tsx`
   - shows how bundled grammar data is merged with backend overrides

5. `/app/practice/[id]/index.tsx`
   - grammar lesson / explanation screen

6. `/app/practice/[id]/PracticeCSV.tsx`
   - grammar exercise engine
   - one of the highest-risk files in the repo

7. `/app/admin/index.tsx`
   - admin dashboard

8. `/app/admin/grammar/[id].tsx`
   - admin grammar/CSV editor

9. `/src/hooks/useSentenceAudio.ts`
   - Google TTS + cached audio path

10. `/website/index.html`, `/website/styles.css`, `/website/script.js`
   - if the task touches the public website

## 3. Important High-Level Rules

### 3.1 Use the README for quick-start, not full architecture truth

`/README.md` is now a real project entry point, but it is still intentionally shorter than this file.

Use it for:

- quick start
- env names
- deployment reminders

Use this file and `/PROJECT_CONTEXT.md` for:

- architecture
- source-of-truth rules
- backend/server/database/API behavior

### 3.2 The backend is essential

Many tasks in this repo cannot be completed correctly by editing the client alone.

The frontend depends on the sibling backend for:

- auth
- grammar progress
- vocab SRS
- bookmarks
- admin grammar editing
- grammar override fetching
- premium sync
- Google TTS audio generation + caching

Backend location:
- `C:\Users\Lux\thai-generator\ai-server`

### 3.3 API base is hardcoded

`/src/config.ts` currently contains:

- `API_BASE = "http://3.0.214.108:3000"`

That means:

- local frontend work often still talks to remote EC2 unless changed
- if the backend changes and EC2 is not updated, the app can appear “broken” even when frontend code is fine

### 3.4 This repo has platform-specific route files

There are many `.web.tsx` files for desktop web.

Important Expo Router rule:

- a `.web.tsx` route often still needs a non-platform sibling file
- examples in this repo:
  - `/app/settings.web.tsx` and `/app/settings.tsx`
  - `/app/review/index.web.tsx` and `/app/review/index.tsx`

Do **not** casually delete the non-platform sibling wrappers. They may look redundant but prevent Expo Router route-manifest errors.

### 3.5 Preserve the current visual language unless the task explicitly changes it

The app currently uses a **square, flat, minimal** design language.

Theme source:
- `/constants/theme.ts`

`Sketch` is the primary theme object.

Notable current design assumptions:

- sharp corners
- very light or no shadows
- warm paper background
- deep indigo accent instead of bright app-store-style gradients

If you reintroduce overly soft rounding or heavy shadows, expect visual mismatch.

## 4. Repo Map

### `/app`

Expo Router screens.

Major groups:

- `/app/(tabs)`
  - home
  - progress
  - explore (bookmarks / grammar browse)
  - profile
  - plus `.web.tsx` desktop variants

- `/app/practice`
  - grammar index
  - grammar lesson page
  - grammar exercises

- `/app/review`
  - vocab SRS review
  - has native + web variants

- `/app/admin`
  - admin dashboard
  - grammar lesson editor

- `/app/alphabet`, `/app/vowels`, `/app/tones`, `/app/trainer`
  - reading / trainer / tone / alphabet learning surfaces
  - most have web variants

- `/app/premium.tsx`
  - custom paywall screen

- `/app/login.tsx`, `/app/register.tsx`, `/app/auth/callback.tsx`
  - auth entry points

### `/src`

Shared logic and components.

Important folders:

- `/src/components`
  - UI primitives and shared feature components
  - `GoogleAuthButton.tsx`
  - `Header.tsx`
  - `ToneGuide.tsx`
  - `VocabSrsInfoSheet.tsx`

- `/src/components/web`
  - desktop shell scaffolding

- `/src/data`
  - bundled grammar/alphabet/vowel/tone/trainer content

- `/src/grammar`
  - runtime merge of bundled grammar + backend overrides

- `/src/subscription`
  - premium logic

- `/src/utils`
  - auth
  - grammar progress
  - exercise settings
  - Thai speech normalization

- `/src/hooks`
  - sentence audio

### `/website`

Standalone marketing website.

This is **not** part of Expo.

Files:

- `/website/index.html`
- `/website/styles.css`
- `/website/script.js`
- `/website/privacy.html`
- `/website/terms.html`
- `/website/products/*.html`

No build tool. Edit directly.

### `/scripts`

Important script:

- `/scripts/exportA1GrammarCsvs.mjs`

This exports bundled grammar practice data into the sibling backend grammar CSV folder.

## 5. Auth Model

### Supported auth modes

1. Email/password
2. Google sign-in
3. Guest mode

### Token storage

Source:
- `/src/utils/authStorage.ts`

Behavior:

- native (`ios`/`android`) uses `expo-secure-store`
- web falls back to `AsyncStorage`
- legacy AsyncStorage tokens are migrated into SecureStore on native

### Guest mode

Source:
- `/src/utils/auth.ts`

Guest mode uses:

- AsyncStorage flag `isGuest`

Implications:

- guests can enter the app
- some actions still require login
- premium purchase/restore requires real account

### Google sign-in

Source:
- `/src/components/GoogleAuthButton.tsx`

Important behavior:

- web uses `expo-auth-session`
- native uses `@react-native-google-signin/google-signin`
- native Google sign-in is **not** supported in Expo Go
- web callback route is `/app/auth/callback.tsx`
- new Google accounts must accept terms before account creation completes
- native currently exposes “Use a different Google account” when previous sign-in exists

## 6. Subscription / Premium / Keystone Access

### Branding

The premium tier is called:

- **Keystone Access**

### Free vs premium rule

Source:
- `/src/subscription/premium.ts`

Current rule:

- free grammar stage = `A1.1`
- `A1.2+` is considered premium

### Native vs web premium behavior

This is one of the most important architectural facts in the repo.

Source:
- `/src/subscription/SubscriptionProvider.tsx`

Native:

- uses RevenueCat on iOS/Android
- purchase flow is through the custom `/premium` screen
- not using hosted RevenueCat paywall UI

Web:

- does **not** purchase via RevenueCat directly
- reads `has_keystone_access` from backend `/me`

### Critical rule

The backend is the **shared account truth** for cross-platform premium state.

The provider was explicitly changed so that:

- local native RevenueCat state can set backend premium to `true`
- but lack of local native entitlement should **not** blindly set backend premium to `false`

Reason:

- web may use a different billing system in the future
- backend access can come from non-RevenueCat providers

### Backend sync requirement

For cross-device premium sync to work, the backend must expose:

- `POST /me/keystone-access`

If EC2 is missing that route, mobile can look premium locally while web still shows locked content.

### Current env caveat

Root `.env` currently contains RevenueCat **Test Store** keys, not production keys.

Do not assume the app env is production-ready just because purchases work locally.

## 7. Grammar Data Model

### Bundled grammar content

Primary files:

- `/src/data/grammar.ts`
- `/src/data/grammarB2.ts`
- `/src/data/grammarStages.ts`
- `/src/data/grammarLevels.ts`

### Important recent state

Intermediate curriculum was expanded from grouped B1/B2 lessons into more atomic lesson IDs.

This means:

- `grammar.ts` and `grammarStages.ts` must stay in sync
- if you add or rename lesson IDs, stage mapping can break runtime startup

### Lesson content vs live override

Bundled defaults live in:

- `/src/data/grammar.ts`

Live admin-edited lesson content lives in backend overrides and is merged at runtime by:

- `/src/grammar/GrammarCatalogProvider.tsx`

This means:

- `grammar.ts` is **not** the only source of truth anymore
- admin edits can change title/pattern/explanation/example/focus without rebuilding the app

## 8. Admin Console Rules

Frontend:

- `/app/admin/index.tsx`
- `/app/admin/grammar/[id].tsx`

Backend:

- sibling backend `server.js` admin routes

What admin edits actually do:

1. **Lesson content**
   - title
   - stage
   - explanation
   - pattern
   - focus particle/meaning
   - main example
   - AI prompt

   These are stored on backend in:
   - `C:\Users\Lux\thai-generator\ai-server\admin-data\grammar-overrides.json`

2. **Practice rows**
   - Thai
   - romanization
   - English
   - difficulty
   - breakdown JSON

   These are written directly to:
   - `C:\Users\Lux\thai-generator\ai-server\grammar\<grammarId>.csv`

### Admin access gate

Backend uses:

- `ADMIN_EMAILS` env var

If admin UI shows “Admin access required”, check backend `.env`, not frontend.

### Performance note

The admin list was optimized to be more atomic:

- stage filtering
- virtualized list
- deferred search

The editor was also made more atomic:

- compact row cards
- edit one row at a time
- bulk TSV/column tools

## 9. Grammar Practice Engine

Core file:

- `/app/practice/[id]/PracticeCSV.tsx`

This file is a high-risk hotspot.

It currently handles:

- study / breakdown view
- build / word-scrap exercise
- match exercise
- autoplay sentence audio
- word breakdown TTS beta behavior
- desktop web layout adjustments

### Exercise mode settings

Source:
- `/src/utils/grammarExerciseSettings.ts`

Current modes:

- `breakdown` => Study
- `wordScraps` => Build
- `matchThai` => Match

### Word breakdown highlighting

The old grammar-point special highlighting inside exercises was intentionally removed.

Do not reintroduce dotted grammar styling unless explicitly asked.

### Word breakdown TTS

This is intentionally beta-gated.

By default:

- breakdown tiles are plain cards

If enabled:

- breakdown tiles can speak using the Google TTS-backed sentence audio pipeline

## 10. Audio / TTS

### Frontend hook

Source:
- `/src/hooks/useSentenceAudio.ts`

Behavior:

1. tries backend `POST /tts/sentence`
2. expects a cached or newly generated audio file path
3. plays via `expo-audio`
4. if backend fails, falls back to `expo-speech`

### Backend TTS

Sibling backend route:

- `POST /tts/sentence`

Backend dependencies:

- `@google-cloud/text-to-speech`

### Cache model

Server stores generated MP3 files in a TTS cache directory.

By default backend resolves:

- `./tts-cache`

and serves from:

- `/tts-cache/sentences/...`

On EC2, these files live on the server disk, not in this frontend repo.

### Config requirements

Backend must have one of:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_TTS_CREDENTIALS_JSON`

If Google TTS breaks:

first check backend logs before touching frontend fallback behavior.

### Important history

The backend previously crashed when:

- Google TTS package was not installed
- credential file was empty/invalid
- premium sync endpoint was missing

A new agent should always consider deployment drift between local code and EC2.

## 11. Vocab / SRS / Heatmap

Frontend surfaces:

- `/app/review/index.native.tsx`
- `/app/review/index.web.tsx`
- `/app/stats/vocab.tsx`

Backend routes include:

- `/vocab/review`
- `/vocab/heatmap`

There is also sibling backend logic in:

- `C:\Users\Lux\thai-generator\ai-server\srs.js`

The home heatmap and SRS state come from backend. If heatmap or review state looks wrong, inspect backend responses before changing UI logic.

## 12. Web/Desktop Layer

Desktop web uses many `.web.tsx` route variants.

Important desktop scaffolding:

- `/app/(tabs)/_layout.web.tsx`
- `/src/components/web/DesktopScaffold.tsx`
- `/src/components/web/DesktopSidebarShell.tsx`
- `/src/screens/web/ReviewDesktopScreen.tsx`
- `/src/screens/web/SettingsDesktopScreen.tsx`

The web app is not just “mobile in a browser”; there are desktop-specific compositions.

When editing web screens:

- look for `.web.tsx` first
- avoid editing only the mobile route if there is a web counterpart

## 13. Static Website Rules

The `/website` folder is separate from the Expo app.

Important facts:

- plain HTML/CSS/JS only
- no bundler
- no React
- used for marketing, product pages, and legal/privacy/terms presence
- homepage sample practice demo is custom DOM logic in `/website/script.js`
- current homepage was recently rebuilt to:
  - be flatter and more app-like
  - include a small interactive demo

If a task mentions “website” or “homepage”, it usually means `/website`, not the Expo web app.

## 14. Backend Deployment / Operations Notes

Backend repo:
- `C:\Users\Lux\thai-generator\ai-server`

Current backend characteristics:

- Express 5
- PostgreSQL via `pg`
- explicit pool tuning in `db.js`
- health endpoint at `/health`
- auth rate limiting
- sentence TTS rate limiting
- TTS concurrency limiting / queueing
- server-side grammar CSV storage

On EC2 it is run with PM2.

If frontend behavior differs from local expectations:

assume EC2 may be running older code until proven otherwise.

### 14.1 What `server.js` actually does

Backend entrypoint:

- `C:\Users\Lux\thai-generator\ai-server\server.js`

It is not a tiny route file. It is currently the main application runtime and owns:

1. **process/bootstrap**
   - loads env with `dotenv`
   - creates the Express app
   - enables `cors`
   - enables JSON body parsing with configurable body limit

2. **service initialization**
   - OpenAI client
   - Google Cloud TTS client
   - grammar CSV loading into memory
   - grammar romanization map building
   - TTS cache path setup and queueing controls

3. **middleware and guards**
   - JWT auth middleware
   - admin-only middleware
   - auth rate limiter
   - sentence TTS rate limiter

4. **route registration**
   - direct Express routes in `server.js`
   - SRS routes registered from `srs.js`
   - transform route registered from `transform.js`

5. **runtime migrations / startup maintenance**
   - adds missing `users` columns
   - creates `user_preferences`
   - creates `grammar_progress`
   - adds SRS columns/indexes on `user_vocab`
   - creates `activity_log`
   - syncs `is_admin` based on `ADMIN_EMAILS`

6. **server health / listen**
   - exposes `/health`
   - reports DB pool and TTS queue/cache stats

### 14.2 Backend file ownership

Use this mental map:

- `server.js`
  - main Express app
  - auth/account
  - grammar progress
  - bookmarks
  - admin routes
  - TTS
  - grammar overrides
  - startup migrations

- `srs.js`
  - vocab review / spaced repetition logic
  - heatmap/activity aggregation
  - `/vocab/*` and `/activity/log`

- `transform.js`
  - AI-generated grammar transformation exercise route
  - `POST /transform`

- `db.js`
  - Postgres connection pool
  - pool sizing/queueing config
  - DB health stats used by `/health`

### 14.3 Database architecture

Database is PostgreSQL.

Pool config lives in:

- `C:\Users\Lux\thai-generator\ai-server\db.js`

Important current behavior:

- explicit `pg.Pool` config instead of defaults
- default pool max is `15`
- if more DB work arrives than free connections, requests wait in the pool queue
- pool exposes `waitingCount`, which is surfaced in `/health`

Important tables the backend currently creates or depends on:

- `users`
  - core account table
  - augmented with:
    - `display_name`
    - `google_sub`
    - `terms_accepted_at`
    - `privacy_accepted_at`
    - `consent_source`
    - `is_admin`
    - `has_keystone_access`
    - `keystone_access_updated_at`

- `user_preferences`
  - currently stores user-level toggles like `track_practice_vocab`

- `grammar_progress`
  - one row per user + grammar id
  - tracks rounds / correctness / last practiced

- `user_vocab`
  - central vocab/SRS table
  - now also uses:
    - `state`
    - `step_index`

- `review_queue`
  - daily queued SRS cards

- `review_sessions`
  - same-day SRS session activity, seen counts, correct counts

- `activity_log`
  - non-vocab activity log used in the combined heatmap

Important indexing/current perf shape:

- unique partial index on `users.google_sub`
- `grammar_progress (user_id, last_practiced DESC)`
- `user_vocab (user_id, state, next_review)`
- `user_vocab (user_id, next_review)`

### 14.4 API groups

The easiest way to understand the backend is by API domain, not by file order.

#### Auth / account

- `POST /signup`
- `POST /login`
- `POST /auth/google`
- `GET /me`
- `PATCH /me`
- `POST /me/keystone-access`
- `POST /me/reset-progress`
- `DELETE /me`

#### Preferences

- `GET /user/preferences`
- `PATCH /user/preferences`

#### Grammar progress / bookmarks

- `GET /grammar/progress`
- `GET /grammar/progress/:grammarId`
- `POST /grammar/progress/round`
- `DELETE /grammar/progress/:grammarId`
- `DELETE /grammar/progress`
- `POST /bookmark`
- `DELETE /bookmark`
- `GET /bookmarks`

#### Admin content management

- `GET /admin/dashboard`
- `GET /admin/grammar`
- `GET /admin/grammar/:grammarId`
- `PUT /admin/grammar/:grammarId`

#### Grammar content / practice helpers

- `POST /practice-csv`
- `GET /grammar/overrides`
- `POST /transform`

#### Vocab / SRS / heatmap

- `GET /vocab/review`
- `POST /vocab/answer`
- `GET /vocab/stats`
- `GET /vocab/progress`
- `GET /vocab/heatmap`
- `GET /vocab/today`
- `POST /activity/log`

#### Audio / TTS

- `POST /tts/sentence`
- static audio files served from `/tts-cache/...`

#### Trainer / misc helpers

- `POST /track-words`
- `POST /alphabet-trainer`
- `GET /debug-user-vocab`
- `GET /health`

## 15. Current Env Surface (Names Only, No Secrets)

Frontend root `.env` currently uses names like:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI`
- `EXPO_PUBLIC_RC_ANDROID_API_KEY`
- `EXPO_PUBLIC_RC_IOS_API_KEY`
- `EXPO_PUBLIC_RC_ENTITLEMENT_ID`

Backend `.env` in sibling repo uses names like:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ADMIN_EMAILS`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_TTS_CREDENTIALS_JSON`
- `DB_POOL_MAX`
- `TTS_MAX_CONCURRENT`
- `TTS_CACHE_DIR`
- `TTS_CACHE_MAX_BYTES`

## 16. Known Gotchas / Easy Ways To Break Things

1. **Deleting fallback route siblings**
   - can break Expo Router on web

2. **Treating RevenueCat as the only premium truth**
   - breaks future web billing model

3. **Editing `grammar.ts` without matching stage changes**
   - can break runtime mapping

4. **Assuming backend admin edits rewrite frontend source**
   - they do not
   - admin lesson content lives in backend override JSON

5. **Testing Google sign-in in Expo Go**
   - native Google sign-in requires a development build

6. **Forgetting the backend is remote**
   - UI may be fine while EC2 route deployment is stale

7. **Ignoring the static website split**
   - `/website` is not Expo

8. **Blindly replacing desktop web screens with mobile code**
   - many web screens are intentionally separate

## 17. Recommended “Fresh Agent” Workflow

If you are starting a task from zero:

1. Read `/src/config.ts`
2. Read `/app/_layout.tsx`
3. Read the route or screen you were asked to change
4. Check whether there is a `.web.tsx` or `.native.tsx` counterpart
5. If the feature touches auth/subscription/grammar data/TTS/admin:
   - inspect the sibling backend too
6. Before assuming a bug is frontend-only:
   - verify backend route existence and deployment

## 18. Commands You Will Actually Use

### Quick Start (Full Stack)

Backend:

```powershell
cd C:\Users\Lux\thai-generator\ai-server
npm install
node .\server.js
```

Frontend:

1. check `API_BASE` in `/src/config.ts`
2. make sure root `.env` is present
3. install dependencies
4. start Expo

```powershell
cd C:\Users\Lux\thai-generator\thaiApp-2
npm install
npx expo start
```

Desktop web:

```powershell
npm run web
```

Android device:

```powershell
npx expo run:android --device
```

Frontend:

```powershell
npm install
npm run lint
npx expo start
npx expo start --web
npx expo run:android --device
```

Frontend scripts:

```powershell
node .\scripts\exportA1GrammarCsvs.mjs
```

Backend:

```powershell
cd ..\ai-server
npm install
node --check .\server.js
node .\scripts\seedShowcaseUser.mjs
```

EC2 / PM2 examples:

```bash
pm2 status
pm2 logs server --lines 100
pm2 restart server --update-env
curl http://localhost:3000/health
```

### Deployment Notes

When deploying the sibling backend to EC2 or another server:

- run `npm install` after pull
- verify backend `.env` exists
- restart the process with updated env

Routes that must exist in deployed builds:

- `/tts/sentence`
- `/me/keystone-access`
- `/grammar/overrides`
- `/health`

If the frontend looks wrong but local code seems fine, verify deployed route existence before editing the client.

## 19. Final Reminder

This codebase is now **multi-surface**:

- mobile app
- desktop web app
- static marketing website
- sibling backend

If you change one surface without checking the others, it is easy to create inconsistencies.
