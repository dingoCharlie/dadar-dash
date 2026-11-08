# Anonymous records integration (not yet live)

## Architecture
A random 32-byte browser token is stored in localStorage. Vercel `api/records` receives it in the `X-Player-Token` header, hashes it with SHA-256, and queries Supabase using a **server-side** service-role key. No browser receives the service-role key. The database saves one record per first successful crossing; score is recomputed server-side.

## Required setup
1. Connect/create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set production and preview Vercel environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` securely (never commit values).
3. Exercise GET (empty), POST (new challenge), repeat POST (idempotent), GET (history & best), DELETE (erase) on the preview deployment.
4. Confirm the game works offline/when the API returns 503, then deploy the **tested** branch to production.

## Limits
Browser tokens identify a single browser profile, not a person. Clearing site storage means losing access to old server records; if the person requests erasure, use the in-game *Delete online records* action first. As with all client-side games, a modified browser can fabricate claimed completion times; this is fine for non-competitive personal history but **not** a trusted leaderboard. Add anti-abuse measures before public rankings.
