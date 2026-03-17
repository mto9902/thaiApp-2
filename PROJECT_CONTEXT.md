# PROJECT_CONTEXT.md

This file explains the project itself: what the product is, what is implemented, how the architecture is split, and what a new agent needs to understand before making changes.

It is intentionally detailed.

## 1. Product Snapshot

### Product family

The umbrella product is:

- **Keystone Languages**

The current active app/codebase is centered on:

- **Keystone Thai**

There are also product surfaces and marketing pages for:

- Keystone Japanese
- Keystone Korean

At the moment, Thai is the most fully realized experience in the app itself. Japanese and Korean currently exist more as product/platform representations on the marketing side and in the conceptual product structure.

### Core learning philosophy

This project is **grammar-first**, not flashcard-first.

The intended learning loop is:

1. Choose a grammar structure
2. Read an explanation and inspect a main example
3. Look at word breakdown / translation
4. Hear the sentence
5. Practice the same structure through focused exercises
6. Repeat until the pattern feels natural

The app is explicitly designed around:

- grammar patterns
- structured progression
- sentence examples
- audio
- repeated targeted practice

The app is **not** meant to feel like:

- generic vocabulary flashcards only
- gamified phrase memorization
- AI-themed gradient-heavy UI

## 2. Project Surfaces

There are four practical surfaces in the overall project:

### A. Mobile app

Built with:

- Expo
- React Native
- Expo Router

Primary target:

- Android

iOS support exists in architecture, but Android has received more hands-on testing in this workspace.

### B. Desktop web app

Also Expo Router / React Native Web, but with many dedicated `.web.tsx` screens and layouts.

This is not supposed to be a simple scaled-up phone UI. There is a desktop-specific shell and a growing set of desktop-optimized screens.

### C. Static marketing site

Located in:

- `/website`

This is independent from Expo and is just:

- HTML
- CSS
- JavaScript

### D. Backend

Located outside this repo in the sibling folder:

- `C:\Users\Lux\thai-generator\ai-server`

This backend is required for most meaningful features.

## 3. The Current App Identity

### Visual direction

The visual language is currently:

- square
- flat
- minimal
- warm off-white backgrounds
- deep indigo accent
- almost no shadow

Theme source:

- `/constants/theme.ts`

Main theme object:

- `Sketch`

### Premium branding

Premium is currently branded as:

- **Keystone Access**

### Free boundary

Free access currently means:

- `A1.1` grammar is free

Premium means:

- `A1.2` and above

This rule is defined in:

- `/src/subscription/premium.ts`

## 4. Main App Structure

### Root app providers

Root entry:

- `/app/_layout.tsx`

Important root providers:

1. `SubscriptionProvider`
2. `GrammarCatalogProvider`

This means two critical runtime overlays happen globally:

- premium/access logic
- bundled grammar + backend override merging

### Main tab routes

Located in:

- `/app/(tabs)`

Current main tabs:

- Home
- Grammar / Progress
- Bookmarks / Explore
- Profile

Desktop web versions exist for the main tabs:

- `/app/(tabs)/index.web.tsx`
- `/app/(tabs)/progress.web.tsx`
- `/app/(tabs)/explore.web.tsx`
- `/app/(tabs)/profile.web.tsx`
- plus `/app/(tabs)/_layout.web.tsx`

### Other important app routes

- `/app/login.tsx`
- `/app/login.web.tsx`
- `/app/register.tsx`
- `/app/auth/callback.tsx`
- `/app/premium.tsx`
- `/app/premium.web.tsx`
- `/app/settings.tsx`
- `/app/settings.web.tsx`
- `/app/review/index.web.tsx`
- `/app/review/index.native.tsx`
- `/app/practice/CSVGrammarIndex.tsx`
- `/app/practice/[id]/index.tsx`
- `/app/practice/[id]/PracticeCSV.tsx`
- `/app/admin/index.tsx`
- `/app/admin/grammar/[id].tsx`

## 5. Auth Model

### Supported auth flows

1. Email + password
2. Google sign-in
3. Guest mode

### Guest mode behavior

Guest mode exists so users can browse/use some parts of the app without a real account.

Source:

- `/src/utils/auth.ts`

Guest state is tracked with:

- AsyncStorage key `isGuest`

### Auth token storage

Source:

- `/src/utils/authStorage.ts`

Behavior:

- native: SecureStore
- web: AsyncStorage
- legacy AsyncStorage token is migrated to SecureStore on native if found

This is important because earlier versions stored auth tokens only in AsyncStorage, which was intentionally migrated away from on mobile.

### Google sign-in details

Source:

- `/src/components/GoogleAuthButton.tsx`

Important implementation details:

- native uses `@react-native-google-signin/google-signin`
- web uses `expo-auth-session`
- new Google sign-ups are terms-gated
- native exposes a “Use a different Google account” secondary action when a previous Google session exists
- Expo Go is not valid for native Google sign-in testing

### Auth backend dependency

The frontend exchanges Google tokens with:

- `POST /auth/google`

Normal auth endpoints include:

- `POST /login`
- `POST /signup`

These are all in the sibling backend.

## 6. Premium / Subscription Architecture

This is one of the most important things to understand correctly.

### Native purchases

On iOS/Android:

- the app uses RevenueCat
- but with a **custom paywall UI**, not RevenueCat’s hosted paywall UI

The custom paywall route is:

- `/app/premium.tsx`

`SubscriptionProvider` handles:

- RevenueCat initialization
- offerings
- purchases
- restores
- entitlement state

### Web premium

Web does **not** read RevenueCat directly.

Instead, web reads:

- backend `/me`
- field: `has_keystone_access`

This matters because:

- web billing is expected to diverge in the future
- backend must be the cross-platform account truth

### Critical sync behavior

Native can push premium truth to the backend via:

- `POST /me/keystone-access`

But the client was intentionally changed to avoid this dangerous behavior:

- “local native RevenueCat is false, therefore backend must also be false”

That logic would break future multi-provider access.

Current intended rule:

- native can confirm and push `true`
- native should not casually revoke shared backend access to `false`

### Practical implication

If a user is premium on mobile but locked on web, the likely causes are:

1. backend route missing or not deployed
2. EC2 running stale backend code
3. backend `has_keystone_access` never got updated

This is not necessarily a frontend problem.

## 7. Grammar Content Architecture

### Bundled grammar

Bundled grammar data lives in:

- `/src/data/grammar.ts`
- `/src/data/grammarB2.ts`

Stage/ordering metadata lives in:

- `/src/data/grammarStages.ts`
- `/src/data/grammarLevels.ts`

### Runtime grammar catalog

The app does **not** just use `grammar.ts` raw anymore.

Instead:

- bundled grammar is loaded
- backend overrides are fetched
- overrides are merged over the bundled data

This happens in:

- `/src/grammar/GrammarCatalogProvider.tsx`

### Important consequence

`grammar.ts` is no longer the full live source of truth for lesson content.

Live lesson content can come from:

- backend override JSON

Bundled `grammar.ts` still matters because:

- it is the fallback/default content
- it defines the base grammar IDs and ordering

But live admin edits do not rewrite that file.

## 8. Grammar Progress Model

Source:

- `/src/utils/grammarProgress.ts`

Behavior:

- logged-in users store grammar progress on the server
- guests store grammar progress in AsyncStorage

Main concepts:

- progress is tracked per grammar ID
- “practiced” means rounds > 0

Backend routes include:

- `GET /grammar/progress`
- `GET /grammar/progress/:grammarId`
- `POST /grammar/progress/round`
- delete/reset variants

## 9. Grammar Practice Engine

Core file:

- `/app/practice/[id]/PracticeCSV.tsx`

This file powers grammar exercises and is one of the densest behavior files in the repo.

Current supported grammar exercise types:

1. Study / breakdown
2. Build / word scraps
3. Match

Settings source:

- `/src/utils/grammarExerciseSettings.ts`

Labels:

- `breakdown` => Study
- `wordScraps` => Build
- `matchThai` => Match

### Important current UX choices

- the old special dotted grammar highlighting was removed
- correct/wrong treatment was made flatter and more matte
- word breakdown TTS is opt-in beta
- some desktop web layout logic also lives in this file

### Risk note

This file is shared across mobile and desktop web.

If changing it:

- test build/match/study
- test web layout
- test mobile layout
- test autoplay and audio end behavior

## 10. Admin Console and Live Content Editing

Frontend admin routes:

- `/app/admin/index.tsx`
- `/app/admin/index.web.tsx`
- `/app/admin/grammar/[id].tsx`
- `/app/admin/grammar/[id].web.tsx`

### What the admin console edits

It edits two different data layers:

#### A. Lesson content

Includes:

- title
- stage
- explanation
- pattern
- AI prompt
- focus particle / meaning
- main example
- example breakdown

Backend storage:

- `C:\Users\Lux\thai-generator\ai-server\admin-data\grammar-overrides.json`

#### B. Practice rows

Includes:

- Thai text
- romanization
- English
- difficulty
- breakdown JSON

Backend storage:

- `C:\Users\Lux\thai-generator\ai-server\grammar\<grammarId>.csv`

### Critical mental model

Admin edits are live runtime content edits.

They are **not** rewriting frontend source files.

So after admin edits:

- bundled source remains as before
- backend overrides + backend CSVs become the real live content

This is intentional and production-suitable for content management, but it means the repo is no longer the only canonical source of truth for lesson content.

## 11. TTS / Audio Architecture

### Frontend audio entry

Source:

- `/src/hooks/useSentenceAudio.ts`

This hook:

1. normalizes Thai text
2. requests backend audio from `/tts/sentence`
3. plays returned cached/generated file through `expo-audio`
4. falls back to `expo-speech` if backend fails

### Backend TTS

Sibling backend route:

- `POST /tts/sentence`

Backend dependency:

- `@google-cloud/text-to-speech`

### Cache behavior

Backend stores generated audio files on disk and reuses them.

This is a real file cache, not just in-memory caching.

Current design:

- first request generates + stores audio
- later requests reuse cached MP3
- if generation fails, frontend falls back to local speech

### Word TTS behavior

Sentence playback is the main path.

Word breakdown TTS also exists, but:

- it is gated behind the beta setting
- it is intentionally not always on

### Backend operational note

The backend was hardened for:

- TTS concurrency limiting
- rate limiting
- cache size control

These were added because repeated uncached TTS requests can otherwise become expensive or blocky.

## 12. Vocab / SRS / Review

Main review screens:

- `/app/review/index.native.tsx`
- `/app/review/index.web.tsx`

Desktop web review layout:

- `/src/screens/web/ReviewDesktopScreen.tsx`

Backend support includes:

- `srs.js`
- `/vocab/review`
- `/vocab/heatmap`

### Heatmap

The home screen heatmap is tied to vocab study activity from backend, not a purely frontend visualization.

### Review help popup

There is an SRS explainer component:

- `/src/components/VocabSrsInfoSheet.tsx`

It has been adjusted for desktop web styling as well.

## 13. Web/Desktop App Architecture

The web app has many dedicated desktop screens.

Important shell/scaffold files:

- `/app/(tabs)/_layout.web.tsx`
- `/src/components/web/DesktopScaffold.tsx`
- `/src/components/web/DesktopSidebarShell.tsx`

Web-only or web-optimized screens exist for:

- home
- progress
- bookmarks/explore
- profile
- review
- settings
- grammar index
- grammar lesson
- admin editor
- tone guide
- tones page
- alphabet/vowel/trainer pages

### Important routing caveat

Expo Router requires some non-platform fallback siblings even when the real desktop implementation is `.web.tsx`.

Examples:

- `/app/settings.tsx`
- `/app/review/index.tsx`

These wrappers should not be removed casually.

## 14. Static Website

Folder:

- `/website`

This is the public marketing site, separate from Expo.

It exists for:

- marketing
- product overview
- public-facing privacy / terms pages
- broader web presence and app-store-compliance support

Important files:

- `/website/index.html`
- `/website/styles.css`
- `/website/script.js`

There are also:

- `/website/privacy.html`
- `/website/terms.html`
- `/website/products/*.html`

### Website behavior

The homepage includes:

- hero
- products
- sample practice
- method
- features
- why grammar matters
- platform overview
- screenshots
- pricing
- FAQ
- footer

The homepage practice demo is interactive and implemented in plain DOM JS, not React.

## 15. Backend Overview

Backend repo:

- `C:\Users\Lux\thai-generator\ai-server`

Backend stack:

- Express 5
- PostgreSQL (`pg`)
- JWT auth
- bcrypt
- OpenAI dependency
- Google Cloud TTS

Important backend files:

- `server.js`
- `db.js`
- `srs.js`
- `transform.js`
- `scripts/seedShowcaseUser.mjs`

### `server.js` architecture

Main backend entrypoint:

- `C:\Users\Lux\thai-generator\ai-server\server.js`

This file is currently the core application runtime, not just a thin router.

The easiest way to think about it is as six layers:

#### 1. Bootstrap / process setup

At startup it:

- loads env with `dotenv`
- creates the Express app
- enables `cors`
- enables JSON body parsing with a configurable limit

#### 2. Service initialization

It initializes or wires together:

- PostgreSQL pool from `db.js`
- OpenAI client
- Google Cloud TTS client
- grammar CSV loading from the backend `grammar` folder
- grammar romanization lookup map
- TTS cache directory, queueing, and cache-size controls

#### 3. Shared middleware / guards

It defines and uses:

- JWT auth middleware
- admin-only middleware
- auth rate limiter
- sentence TTS rate limiter

#### 4. Route registration

Some routes live directly in `server.js`, while others are registered from sibling files:

- `registerSRSRoutes(app, authMiddleware)` from `srs.js`
- `registerTransformRoute(app, openai)` from `transform.js`

#### 5. Startup migrations / maintenance

On startup, it also performs schema maintenance and operational sync:

- adds missing account columns to `users`
- creates `user_preferences` if missing
- creates `grammar_progress` if missing
- augments `user_vocab` for the newer SRS model
- adds performance indexes
- creates `activity_log` if missing
- syncs `users.is_admin` using `ADMIN_EMAILS`

#### 6. Health + listen

It exposes:

- `GET /health`

and then starts listening on the configured port.

`/health` is important because it reports:

- server is alive
- DB pool stats
- TTS queue/cache stats

### File ownership within the backend

#### `server.js`

Owns:

- auth
- account profile
- premium sync
- preferences
- grammar progress
- bookmarks
- admin dashboard/editor routes
- grammar overrides
- practice CSV serving
- TTS generation endpoint
- startup migrations

#### `srs.js`

Owns:

- vocab review scheduling/session logic
- queueing cards for the current day
- answer processing
- vocab stats/progress
- combined heatmap data
- activity logging

#### `transform.js`

Owns:

- `POST /transform`
- AI-generated grammar transformation exercise content

#### `db.js`

Owns:

- Postgres pool creation
- pool tuning
- pool health stats

### Database pool

`db.js` now explicitly configures a PostgreSQL pool with queueing behavior.

Important because:

- the app is expected to handle multiple concurrent users on a single-server launch
- extra DB requests wait on the pool rather than opening unlimited connections

Current pool defaults in `db.js`:

- `DB_POOL_MAX` => default `15`
- `DB_POOL_IDLE_TIMEOUT_MS` => default `30000`
- `DB_POOL_CONNECTION_TIMEOUT_MS` => default `5000`
- `DB_POOL_MAX_USES` => default `7500`

Meaning:

- a single server can handle multiple simultaneous users
- DB work is throttled by the pool instead of spawning unlimited connections
- if the pool is exhausted, requests wait in queue

### Database architecture

The database is PostgreSQL, but the schema is a mix of:

- older pre-existing tables
- startup-time migrations in `server.js`
- SRS-specific tables depended on by `srs.js`

The safest mental model is:

- `users` is the account root
- most user-owned tables reference `users(id)`
- grammar, vocab, bookmarks, preferences, and heatmap state all hang off that account id

#### Core account table

`users` is the central identity table.

The backend now expects it to include or be augmented with:

- `display_name`
- `google_sub`
- `terms_accepted_at`
- `privacy_accepted_at`
- `consent_source`
- `is_admin`
- `has_keystone_access`
- `keystone_access_updated_at`

There is also a unique partial index on:

- `google_sub` when it is not null

#### Preferences table

`user_preferences`

Purpose:

- user-level toggles and app behavior flags

Current important field:

- `track_practice_vocab`

#### Grammar progress table

`grammar_progress`

Purpose:

- tracks practice state per user + grammar id

Key fields:

- `user_id`
- `grammar_id`
- `rounds`
- `correct_rounds`
- `last_practiced`

Current important index:

- `(user_id, last_practiced DESC)`

#### Vocabulary / SRS tables

The vocab review system depends on:

- `user_vocab`
- `review_queue`
- `review_sessions`

`user_vocab` is the long-lived vocab state table and now includes:

- `state`
- `step_index`
- review timing fields such as `next_review`

`review_queue` is the short-term daily queue:

- which cards are served today
- whether they were already served
- daily order/position

`review_sessions` tracks same-day study activity:

- seen count
- correct count
- last shown timestamp

Current SRS-related indexes include:

- `user_vocab (user_id, state, next_review)`
- `user_vocab (user_id, next_review)`

#### Activity / heatmap table

`activity_log`

Purpose:

- stores non-vocab activity counts used in the combined heatmap

Important detail:

- vocab heatmap data is also aggregated from `review_sessions`
- the final heatmap is a merge of vocab activity + `activity_log`

### API architecture

The easiest way to understand the backend APIs is by domain.

#### Auth APIs

- `POST /signup`
- `POST /login`
- `POST /auth/google`

These handle:

- account creation
- email/password login
- Google identity exchange
- terms/privacy acceptance timestamps on Google signup

#### Account APIs

- `GET /me`
- `PATCH /me`
- `POST /me/keystone-access`
- `POST /me/reset-progress`
- `DELETE /me`

These handle:

- current account identity
- display name changes
- shared premium state sync
- full progress reset
- account deletion

#### Preference APIs

- `GET /user/preferences`
- `PATCH /user/preferences`

Used by the app for:

- user toggles like vocab tracking

#### Grammar progress APIs

- `GET /grammar/progress`
- `GET /grammar/progress/:grammarId`
- `POST /grammar/progress/round`
- `DELETE /grammar/progress/:grammarId`
- `DELETE /grammar/progress`

Used by:

- progress screen
- grammar cards
- exercise completion/progress updates
- reset flows

#### Bookmark APIs

- `POST /bookmark`
- `DELETE /bookmark`
- `GET /bookmarks`

Used by:

- bookmark buttons
- bookmarks/explore tab
- mixed practice entry points

#### Admin / live content APIs

- `GET /admin/dashboard`
- `GET /admin/grammar`
- `GET /admin/grammar/:grammarId`
- `PUT /admin/grammar/:grammarId`

Used by:

- admin overview stats
- grammar lesson content editor
- grammar CSV row editor
- bulk TSV/column editing workflows

#### Grammar content / exercise helper APIs

- `POST /practice-csv`
- `GET /grammar/overrides`
- `POST /transform`

Used by:

- loading sentence rows for a grammar id
- merging admin-edited lesson content into the app
- generating transform-style grammar exercise content with OpenAI

#### Vocab / SRS APIs

- `GET /vocab/review`
- `POST /vocab/answer`
- `GET /vocab/stats`
- `GET /vocab/progress`
- `GET /vocab/heatmap`
- `GET /vocab/today`
- `POST /activity/log`

Used by:

- SRS review screen
- today counters
- profile vocab stats
- home heatmap
- non-vocab activity aggregation

#### Audio / TTS APIs

- `POST /tts/sentence`
- static audio serving from `/tts-cache/...`

Used by:

- grammar lesson sentence playback
- grammar exercise sentence playback
- word breakdown beta TTS
- vocab/SRS sentence playback
- alphabet/consonant/vowel audio on web where routed through the shared audio hook

#### Trainer / helper APIs

- `POST /track-words`
- `POST /alphabet-trainer`
- `GET /debug-user-vocab`

Used by:

- practice vocab ingestion
- alphabet trainer batch generation
- debugging / inspection during development

### Quick Start (Full Stack)

To run the project end-to-end:

1. start the backend from the sibling repo
2. verify the frontend API URL points to the right backend
3. run Expo for mobile or web

Backend:

```powershell
cd C:\Users\Lux\thai-generator\ai-server
npm install
node .\server.js
```

Frontend:

```powershell
cd C:\Users\Lux\thai-generator\thaiApp-2
npm install
npx expo start
```

If you want the frontend to talk to a local backend instead of EC2, update:

- `/src/config.ts`

### Deployment Notes

Production issues have already happened here because deployed backend code drifted behind the frontend.

When deploying backend changes:

- run `npm install` after pulling
- verify the backend `.env` exists and is correct
- restart PM2 / the service with updated env

Critical deployed routes:

- `/tts/sentence`
- `/me/keystone-access`
- `/grammar/overrides`
- `/health`

If premium sync or Google TTS fails in production, check deployed backend route existence and env first.

## 16. Environment Surface and Current Reality

### Frontend `.env`

Frontend root `.env` currently contains:

- Google client IDs
- Google web redirect URI
- RevenueCat mobile keys
- RevenueCat entitlement ID

Important current reality:

- RevenueCat keys are currently test-store style keys
- web redirect still points at localhost

This means:

- local/dev auth and subscription flows may work
- but the env is not “obviously production-safe” just because things run

### Backend env

Sibling backend `.env` contains:

- DB credentials
- `ADMIN_EMAILS`
- Google TTS credential path/json
- pool and TTS tuning envs

### Security note

These docs intentionally do **not** reproduce live secrets.

They only describe names and behavior.

## 17. Known Historical Pain Points

These are worth preserving for a future agent because they have already caused real confusion.

### A. Backend drift vs frontend code

The frontend may be correct locally while EC2 is missing:

- `/me/keystone-access`
- `/tts/sentence`
- or package installs such as Google TTS dependency

Always verify deployment state before over-editing the client.

### B. Google TTS failures were often operational, not UI

Real causes already encountered:

- missing `@google-cloud/text-to-speech`
- invalid or empty credential file
- env var typo for `GOOGLE_APPLICATION_CREDENTIALS`
- backend not listening at all

### C. Web premium sync confusion

If premium works on mobile but not web, do **not** assume web RevenueCat is the answer.

Web trusts backend `has_keystone_access`.

### D. Admin edits changed the architecture

After the admin console was added:

- backend override JSON + backend CSVs became live content truth
- bundled source became default/fallback truth

### E. Route-sibling issues on web

The project already hit Expo Router errors when `.web.tsx` files lacked fallback siblings.

## 18. Scripts and Operational Helpers

### Frontend scripts

From `/package.json`:

- `npm run start`
- `npm run web`
- `npm run android`
- `npm run lint`

### Frontend helper script

- `/scripts/exportA1GrammarCsvs.mjs`

This exports grammar CSV content into the backend grammar folder.

If curriculum data changes and backend CSVs must be regenerated, this file matters.

### Backend helper script

- `C:\Users\Lux\thai-generator\ai-server\scripts\seedShowcaseUser.mjs`

This exists for generating a pre-populated showcase/demo account with:

- grammar progress
- vocab cards
- bookmarks
- heatmap activity

The exact live credentials should be treated operationally, not hardcoded into project docs.

## 19. What A Fresh Agent Should Assume Is “Source of Truth”

This is the safest mental model:

### UI and navigation source of truth

- this repo

### Bundled grammar defaults

- this repo

### Live grammar lesson content

- backend override JSON

### Live grammar practice rows

- backend grammar CSV files

### Premium shared account truth

- backend `has_keystone_access`

### Native purchase provider truth

- RevenueCat on mobile

### Sentence/word audio truth

- backend cached/generated files, with frontend fallback speech only as backup

### User progress truth

- backend for logged-in users
- AsyncStorage for guests

## 20. Recommended Mental Checklist Before Editing Anything

Ask yourself:

1. Is this mobile, desktop web app, or static website?
2. Is there a `.web.tsx` variant?
3. Is the behavior backed by the sibling backend?
4. Is the source of truth bundled, backend-override, backend-CSV, or backend-account-state?
5. Could EC2 deployment drift explain the problem before I change UI code?

If you answer those correctly, you will avoid most of the mistakes that have already happened in this codebase.
