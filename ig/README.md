# CampusGram — Next.js 15 Instagram-style starter

A full-feature Instagram clone built on **Next.js 15 (App Router) + React 19 + Postgres (Neon/Vercel) + Drizzle + Auth.js v5 + Vercel Blob**.

## Features

- 🔐 Email/password + Google OAuth (Auth.js v5)
- 📰 Feed with multi-image **carousels**, likes, comments, **saves**
- 👥 Profiles, follow/unfollow, follower/following counts
- 🔍 Explore (user + post search)
- ⭕ **Stories** — 24h ephemeral images/video, viewer tracking
- 🎬 **Reels** — vertical autoplay short-form video feed
- 💬 **Direct Messages** — 1:1 threads, realtime via Server-Sent Events
- 🔔 Notifications (likes, comments, follows, mentions)
- 📸 Media uploads via **Vercel Blob** (local fallback in dev)
- 🎨 Instagram-faithful UI (Tailwind, dark/light, mobile-first)

## Local setup

```bash
# 1. Install
bun install         # or: npm install / pnpm install

# 2. Provision Postgres
#    Option A — Neon: https://neon.tech → new project → copy connection string
#    Option B — Vercel Postgres: dashboard.vercel.com → Storage → Create Postgres
#    Option C — Local: docker run -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:16

# 3. Configure env
cp .env.example .env.local
#    Fill: DATABASE_URL, AUTH_SECRET (openssl rand -base64 32),
#          AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (optional),
#          BLOB_READ_WRITE_TOKEN (optional in dev)

# 4. Push schema
bun run db:push

# 5. (Optional) seed demo data
bun run db:seed

# 6. Run
bun run dev   # http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. https://vercel.com/new → import the repo.
3. **Storage tab** → create a Postgres database → "Connect" (sets `DATABASE_URL`).
4. **Storage tab** → create a Blob store → "Connect" (sets `BLOB_READ_WRITE_TOKEN`).
5. **Settings → Environment Variables** → add `AUTH_SECRET` (and Google OAuth if used).
6. **Deploy.** The build runs `next build`; on first deploy, run `bun run db:push` once via `vercel env pull && bun run db:push`, or use a Vercel build hook.

## Project layout

```
src/
  app/                 # App Router pages + route handlers
    api/               # REST endpoints (posts, comments, follows, messages, upload, ...)
    (auth)/            # sign-in, sign-up
    [username]/        # profile pages
    p/[postId]/        # post detail
    direct/[threadId]/ # DM thread
    reels/             # reels feed
    explore/           # explore grid + search
  components/          # PostCard, StoriesBar, ReelsPlayer, DMThread, Composer, Nav
  db/                  # Drizzle schema, client, seed, migrate
  lib/                 # auth.ts (NextAuth), uploads.ts, utils.ts
  server/              # server actions
drizzle/               # generated SQL migrations
schema.sql             # standalone SQL (run on any Postgres without Drizzle)
```

## Tech notes

- **DB**: Drizzle ORM over `@neondatabase/serverless` (Edge-compatible). Swap to node-postgres for local Docker by changing `src/db/index.ts`.
- **Auth**: Auth.js v5 with Drizzle adapter; sessions in JWT.
- **Realtime DMs**: SSE endpoint `/api/messages/stream?thread=...` polls Postgres `LISTEN/NOTIFY` (Neon does not support LISTEN, falls back to 2s poll).
- **Uploads**: `lib/uploads.ts` writes to Vercel Blob in prod; in dev with no token, writes to `public/uploads/`.
- **Stories expiry**: filtered by `expires_at > now()` at query time; optional cron route at `/api/cron/expire-stories` cleans rows.

## Production checklist

- [ ] Set `AUTH_TRUST_HOST=true` on Vercel
- [ ] Add Google OAuth redirect: `https://<your-domain>/api/auth/callback/google`
- [ ] Enable `NEXT_PUBLIC_SITE_URL` for absolute URLs in OG tags
- [ ] Configure Vercel cron in `vercel.json` for story expiry

License: MIT
