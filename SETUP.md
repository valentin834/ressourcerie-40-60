# Setup Guide — Ressourcerie Outils 40-60 Studio

Estimated time: 30–40 minutes. Everything runs on free tiers.

## Prerequisites
- A Slack workspace (free plan is fine)
- A GitHub account
- A Supabase account (supabase.com)
- A Google account (for Gemini API)
- A Vercel account (vercel.com)

---

## Step 1 — Supabase (~5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to you, set a strong password
3. Go to **SQL Editor** → paste the full contents of `supabase/migrations/001_init.sql` → Run
4. Go to **Project Settings → API**:
   - Copy **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Gemini API Key (~2 min)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → Create API Key in new project
3. Copy the key → this is your `GEMINI_API_KEY`

Free tier: 1500 requests/day, 15 requests/minute — sufficient for a small team.

---

## Step 3 — Deploy to Vercel (~10 min)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
3. Add these **Environment Variables** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` — from Step 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Step 1
   - `GEMINI_API_KEY` — from Step 2
   - `SLACK_BOT_TOKEN` — fill in after Step 4
   - `SLACK_SIGNING_SECRET` — fill in after Step 4
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL (e.g. `https://ressourcerie.vercel.app`)
4. Deploy. Note your Vercel URL — you'll need it in Step 4.

---

## Step 4 — Slack App (~15 min)

### Create the app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → From scratch
   - App Name: `Ressourcerie Bot`
   - Workspace: your workspace
2. Click **Create App**

### Set OAuth permissions

3. In the left sidebar → **OAuth & Permissions**
4. Scroll to **Scopes** → **Bot Token Scopes** → Add these:
   - `channels:history`
   - `chat:write`
   - `reactions:read`
5. Scroll up → **Install App to Workspace** → Allow
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`) → this is your `SLACK_BOT_TOKEN`

### Get signing secret

7. In the left sidebar → **Basic Information** → **App Credentials**
8. Copy **Signing Secret** → this is your `SLACK_SIGNING_SECRET`

### Enable Event Subscriptions

9. In the left sidebar → **Event Subscriptions** → toggle **Enable Events**
10. In **Request URL**, enter: `https://YOUR-VERCEL-URL/api/slack/events`
    - Wait for the ✅ Verified checkmark (Slack sends a challenge request)
11. Scroll to **Subscribe to Bot Events** → **Add Bot User Event** → `message.channels`
12. Click **Save Changes**

### Enable Interactivity

13. In the left sidebar → **Interactivity & Shortcuts** → toggle **On**
14. In **Request URL**, enter: `https://YOUR-VERCEL-URL/api/slack/actions`
15. Click **Save Changes**

### Reinstall and invite the bot

16. Slack will ask you to reinstall the app — do so (**OAuth & Permissions → Reinstall to Workspace**)
17. In your Slack workspace, go to `#intra_news` and type: `/invite @Ressourcerie Bot`

---

## Step 5 — Update Vercel with Slack credentials (~2 min)

1. Go to Vercel → your project → **Settings → Environment Variables**
2. Add or update:
   - `SLACK_BOT_TOKEN` (from Step 4)
   - `SLACK_SIGNING_SECRET` (from Step 4)
3. Go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

---

## Testing the full flow

1. Post a message with a URL in `#intra_news`, e.g.:
   > Check this out: https://figma.com
2. Within a few seconds, the bot should reply in the thread:
   > 🔗 **Lien détecté :** `figma.com`
   > [+ Ajouter à la BDD outils]
3. Click the button — the message updates to "⏳ Analyse en cours…"
4. After ~5–10 seconds: "✅ **Figma** ajouté à la ressourcerie!"
5. Visit your Vercel URL — the tool appears in the table
6. Click the row — the detail modal opens
7. Click any text field in the modal — it becomes editable (Notion-style)

---

## Troubleshooting

**Bot doesn't reply to messages:**
- Check that the bot is in the channel (`/invite @Ressourcerie Bot`)
- Verify the Event Subscriptions URL is verified (green checkmark in Slack settings)
- Check Vercel function logs (Vercel → project → Functions tab)

**"⚠️ Impossible d'accéder à ce lien":**
- The URL is behind a paywall, login wall, or returns an error. The bot cannot scrape protected pages.

**"⚠️ Analyse incomplète":**
- Gemini couldn't generate a valid JSON response. Try a different URL, or add the tool manually.

**Supabase connection errors:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in Vercel
- Make sure the SQL migration was run in the Supabase SQL editor

---

## Free tier limits (as of 2026)

| Service | Free tier limit | Notes |
|---|---|---|
| Vercel | 100 GB bandwidth/month | More than enough for a team tool |
| Supabase | 500 MB database | Enough for thousands of tool cards |
| Gemini 1.5 Flash | 1500 requests/day | ~42 tools/day before hitting limit |
| Slack API | Unlimited | Free for all workspaces |
