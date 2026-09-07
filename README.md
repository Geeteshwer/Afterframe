# Afterframe

A film discovery club with curated browsing, optional TMDB search, saved watchlists, public reviews with independent theatre verdicts, private movie recommendations, and an Gemini-powered conversational film companion.

## Run

Install with `npm ci` and start with `npm run dev`. The Sites starter provides local ChatGPT sign-in. Apply the generated Drizzle migration to the local D1 database before testing social features. Production migrations are included in the Sites package.

## Connections

Configure `TMDB_READ_TOKEN`, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL` as hosted secrets/environment variables. `.env.example` lists the same keys for development. Without keys, the catalog clearly shows eight curated films and chat reports that its connection is pending. No LLM output is simulated. TMDB and Gemini credentials stay server-side.

The initial deployment is owner-private. Shared community use requires changing site access. Authentication is provided by Sites/ChatGPT; messages and saved films are filtered server-side by the trusted authenticated identity. Local test identity headers cannot bypass the starter's authentication middleware.

## Checks

`npm run build` and `npx tsc --noEmit`.

Local integration checks covered authentication, origin checks, review input validation, profile persistence, watchlist persistence/removal, anonymous data isolation, sending a movie attachment, catalog search and the missing-key response. The test harness in `scripts/check-local.mjs` expects the generated migration and a local test recipient (`test-bob`) and should run only against a disposable local database. Clear test fixtures afterward.

Browser visual QA was not requested. WebMCP `search_movies` is feature-detected; no supported contract-test context was available, so its browser registration is unverified. Live Gemini recommendations and a conversational follow-up were verified with gemini-3.5-flash-lite. Live TMDB search was verified with Spirited Away, outside the curated starter shelf.

Poster source links are in `lib/movies.ts` and the site's credits.

Gemini request/response tests: `node --experimental-strip-types scripts/check-gemini.mjs`. The Gemini API key is stored only as a hosted secret.
