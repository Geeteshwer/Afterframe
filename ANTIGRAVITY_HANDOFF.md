# Next steps

Read README.md first. The code is ready to continue; do not infer that the live Supabase schema exists.

1. Apply `supabase/migrations/202609080001_afterframe.sql` in the named Supabase project.
2. Configure Auth Site URL/redirect allowlist and local `.env`.
3. Test two real users: signup/email confirmation/login, persistent session/refresh/logout, create club, join by code, optional review combinations, same-club recipients, send recommendation, inbox and read receipt.
4. Verify an unrelated third user cannot read club profiles/reviews/recommendations or forge writes. Automated PGlite policy tests already pass.
5. Deploy the Supabase build only after those checks. The currently published Sites version remains the earlier D1 version.
6. Decide hosting audience with the owner. No public-access changes were made.
7. Plan legacy data migration with explicit ChatGPT-ID → Supabase-UUID mapping; do not guess identities or overwrite old data.

All credentials belong in ignored environment files or hosted secrets. Never add `sb_secret_`, Gemini, or TMDB bearer credentials to Git. Supabase Data API requests must always carry a user JWT and publishable key; do not swap in a service-role key to work around an RLS error.
