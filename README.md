# AfterFrame-Movie / Afterframe

A cinema-inspired movie discovery app with TMDB catalog search, Gemini conversations, optional star/like/text reviews, watchlists, Supabase email authentication, film clubs, and club recommendations.

## Continue in Antigravity

1. Clone this repository and open the folder in Antigravity.
2. Use Node.js 22.13+ and run `npm ci`.
3. Copy `.env.example` to `.env` and configure the listed values. Never commit `.env`.
4. In Supabase project `gjczysrzjlbxccetkjha`, run `supabase/migrations/202609080001_afterframe.sql` once in SQL Editor. It creates the tables, triggers, club functions, grants, and RLS in one transaction. Do not run the old SQLite/Drizzle migrations in Supabase.
5. In Supabase Authentication → URL Configuration, set your deployed Site URL and add `http://localhost:3000` (or the local port shown by the dev server) to allowed redirect URLs. Email confirmation is currently enabled; new users confirm their email and then sign in.
6. Run `npm run dev`, then open the URL printed in the terminal.
7. Sign up, confirm your email, sign in, create a club in Profile, and share its club code with another registered user. A code lets its holder join that club.
8. Select a movie → Recommend → choose the club and one of its members → add a note → Send recommendation. The recipient sees it in Inbox and can mark it read.

## Status at handoff

- Complete source and build are included; Supabase implementation builds and TypeScript checks pass.
- Supabase project is reachable and email/password auth is enabled.
- **The Supabase SQL migration has not been applied remotely.** The dashboard was at its sign-in page; a database API key cannot run arbitrary schema SQL. Apply the migration before testing signup/profile/club flows.
- SQL migration and RLS behavior were executed successfully in a disposable local PostgreSQL engine (PGlite), with different authenticated identities and an anonymous role.
- The currently published Sites app still uses its previous D1 backend. It was deliberately not replaced by a Supabase build whose tables do not yet exist.
- Supabase URL and publishable key are configured in hosted Sites environment variables. The secret key is not used in app requests; every table request uses the publishable key plus the signed-in user's JWT, so RLS applies.
- Gemini (`gemini-3.5-flash-lite`) and TMDB credentials remain in hosted secret storage, not Git. Add your own values to the ignored local `.env` for local development.
- Production Supabase authentication/session/confirmation behavior still needs end-to-end validation after migration and redirect setup.
- Existing D1 data remains intact. Legacy ChatGPT user IDs and new Supabase Auth UUIDs are different. No legacy reviews or messages were silently reassigned. A future data migration needs an explicit user mapping.

## Architecture

- `app/page.tsx`: discovery, reviews, profile/clubs, recommendation modal, inbox, chatbot.
- `components/afterframe/auth-form.tsx`: email/password signup and login UI.
- `app/api/auth/route.ts`: signup/login/logout. Access and refresh tokens live in HttpOnly, SameSite cookies, Secure in production.
- `lib/supabase.ts`: validates users with Supabase Auth, refreshes sessions, and sends authenticated Data API requests. No service-role fallback.
- `app/api/social/route.ts`: profiles, own watchlist, visible shared-club reviews, recommendations, read receipts, create/join club.
- `app/api/catalog/route.ts`: TMDB search and full-catalog genre browsing.
- `app/api/chat/route.ts` and `lib/gemini.ts`: Gemini bot, gated by Supabase session.
- `supabase/migrations/`: PostgreSQL schema and RLS.
- `db/`, `drizzle/`, `app/chatgpt-auth.ts`: retained legacy D1/ChatGPT backend artifacts, not used by the new social/auth endpoints. Keep until a data migration is planned.

### Data/access rules

The requested tables are `profiles`, `clubs`, `memberships`, `reviews`, and `recommendations`. `watchlist` and optional-review metadata preserve existing app features. Reviews can omit stars, likes, text, and screen verdict. Saving an existing film updates the current user's record.

Profiles and reviews are readable by their owner and shared-club members. Recommendations belong to a specific club and are readable by its members, matching the requested shared-club policy. The inbox explicitly queries `receiver_id = current user`; it does not list every readable recommendation. Only the sender can insert, only for a recipient in that club. Only the recipient can update `is_read`, with column grants preventing note/sender/receiver changes. Membership is created only through club creation or an invitation-code function.

Sites still has an outer owner-private access gate. Supabase login does not make the Sites URL public. Choose the intended audience before changing hosting access.

## Checks

```sh
npx tsc --noEmit
npm run build
node --experimental-strip-types scripts/check-reviews.mjs
node --experimental-strip-types scripts/check-catalog.mjs
node --experimental-strip-types scripts/check-gemini.mjs
```

For RLS tests, install `@electric-sql/pglite` separately and point `PGLITE_MODULE` to its `dist/index.js`, then run `node scripts/check-supabase-rls.mjs`. The test database is disposable and never uses Supabase production credentials.

`scripts/check-local.mjs` is retained as a **legacy D1 test**, not a test of the new Supabase endpoints. Browser visual QA and live Supabase end-to-end tests are not claimed.

## Deployment

This is React 19 + Vinext/Vite, using Cloudflare-compatible server APIs. `npm run build` outputs `dist/client` and `dist/server`. It is not a static-only app. `.openai/hosting.json` identifies the original Sites project. Keep existing D1 bindings/history until legacy-data migration is decided. The Supabase migration is applied separately in Supabase, never via Drizzle.

Poster sources are credited in `lib/movies.ts` and the About dialog. TMDB data attribution appears in the interface.
