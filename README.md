# Summer Tracker

A personal dashboard to track jobs you've applied to, LeetCode problems
you've solved, projects you're shipping, and how you're spending your
summer day-to-day.

- **Manual quick-add** for everything (one form, two clicks).
- **LeetCode auto-sync** by username (uses the public GraphQL endpoint).
- **Browser extension** that saves a job posting from LinkedIn / Indeed /
  Greenhouse / Lever / Ashby / Workday in one click.
- **Magic-link auth** via Supabase. Your data is in your Postgres,
  row-level-secured to your user.
- **Clean UI** built with Next.js 14 (App Router), TypeScript, Tailwind,
  Recharts, lucide-react.

---

## 1. Set up Supabase (free)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste `supabase/schema.sql`, click **Run**.
3. Open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, do not expose)*
4. **Authentication → URL Configuration**:
   - Set **Site URL** to your deployed URL (e.g. `https://your-app.vercel.app`)
     and `http://localhost:3000` during development.
   - Add the same URLs to **Additional Redirect URLs**.

## 2. Run locally

```bash
cp .env.local.example .env.local
# Fill in the Supabase keys + your LeetCode username
npm install
npm run dev
```

Visit `http://localhost:3000` → enter your email → click the magic link.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on [vercel.com](https://vercel.com).
3. Add the same env vars from `.env.local` in **Project → Settings → Environment Variables**.
4. Redeploy. Update Supabase **Site URL** to the Vercel URL.

## 4. LeetCode sync

Two ways:

- **From the UI**: go to `/leetcode` → **Sync from LeetCode** → enter your
  username. New solved problems are added.
- **From the CLI** (good for a cron/Vercel scheduled job):

  ```bash
  npm run sync:leetcode <your-auth-user-uuid> <leetcode-username>
  ```

  Find your user UUID in Supabase → Authentication → Users.

> **Private profile?** Set `LEETCODE_SESSION` in env to the value of your
> browser's `LEETCODE_SESSION` cookie on leetcode.com.

## 5. Browser extension (one-click job saving)

See [`extension/README.md`](extension/README.md).

Important: for the extension's `POST /api/jobs` to be authenticated, you
must be signed in to your tracker in the same browser. The extension
sends your session cookie cross-origin. If Chrome blocks the cookie due
to SameSite restrictions, sign in to the tracker, then immediately use
the extension on the same browsing session.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + a small in-repo shadcn-style component kit
- **Supabase** (Postgres, Auth, RLS)
- **Recharts** for the activity chart
- **lucide-react** icons

## Project structure

```
app/                  Next.js routes + API
  api/                REST API (jobs, leetcode, projects, daily)
  auth/callback/      Magic-link redirect handler
components/           UI components (forms, nav, cards)
  ui/                 Primitives (button, input, card, dialog, badge)
lib/
  leetcode.ts         LeetCode GraphQL client
  supabase/           Server + browser Supabase clients
  types.ts            Shared TS types
scripts/
  sync-leetcode.ts    Standalone LeetCode sync (cron-friendly)
supabase/
  schema.sql          Run once in the Supabase SQL editor
extension/            Chrome MV3 extension for one-click job saving
```

## Roadmap

- Email-based "I applied to X" auto-detection (Gmail filter → webhook).
- Weekly summary email.
- Charts: streak heatmap, jobs-by-source funnel, LC topic coverage.
- Per-problem revisits & spaced repetition.
