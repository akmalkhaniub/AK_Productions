# 📡 Studio Intelligence — Setup Guide

The Studio Intelligence agent compiles a **daily brief** of new uploads across
the YouTube channels your studio tracks, and can deliver it to email/Slack.

It has two entry paths:

1. **Manual channels (no login)** — paste channel IDs and run a brief now. Great
   for demos; nothing to configure beyond an LLM key.
2. **Connect YouTube (OAuth)** — authorize once and the agent reads your
   subscriptions automatically.

---

## 1. How it works (and why it's cheap)

| Step | Source | Cost |
|---|---|---|
| Which channels to track | OAuth `subscriptions.list` (once) | ~1 quota unit |
| What's new (last 24h) | Public RSS `…/feeds/videos.xml?channel_id=` | **free, no quota** |
| Understand a video | `youtube-transcript-api` | free |
| Summarize + compose brief | OpenAI (tool-calling agent) or Gemini | LLM tokens |

Reading new uploads via **RSS** is the key design choice — it avoids the
YouTube Data API's 10,000 unit/day budget (a single `search.list` is 100 units).

---

## 2. Minimum to demo (manual channels)

You only need a working LLM key.

1. Set one in `backend/.env`:
   - `OPENAI_API_KEY=…` (uses the tool-calling agent), **or**
   - `GEMINI_API_KEY=…` and switch the provider in the **Admin** panel
     (`/admin`) → *Studio Intelligence provider* → `gemini`.
2. Start backend + frontend, open **/industry-intel**.
3. Under *Track channels manually*, paste a channel ID (looks like
   `UC_x5XG1OV2P6uZZ5FSM9Ttw`) and click **Run brief**.

> Find a channel ID: open the channel → View Page Source → search for
> `"channelId"`, or use a "YouTube channel ID finder" tool.

---

## 3. Connect YouTube (OAuth)

### a. Create an OAuth client
1. [console.cloud.google.com](https://console.cloud.google.com) → your project.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **APIs & Services → OAuth consent screen** → External → add yourself as a
   **Test user** (required while unverified).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   *Web application*.
   - **Authorized redirect URI:** `http://localhost:8000/api/intel/oauth/callback`
     (must match `OAUTH_REDIRECT_URI` exactly).

### b. Configure `backend/.env`
```env
GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxx
OAUTH_REDIRECT_URI=http://localhost:8000/api/intel/oauth/callback
FRONTEND_URL=http://localhost:3000
```

### c. Connect
Open **/industry-intel → Connect with Google**, approve the consent screen, and
you'll bounce back connected. Click **Run brief** on your account.

> ⚠️ **Restricted scope.** `youtube.readonly` is a restricted scope. While your
> OAuth app is unverified you're limited to test users (~100). A public launch
> requires Google's OAuth verification (privacy policy + security review).

---

## 4. Delivery (optional)

Add to `backend/.env`:
```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASSWORD=app-password
SMTP_FROM=you@example.com
# Slack (incoming webhook URL)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/…
```
Then call `POST /api/intel/run` with `{"account_id": <id>, "deliver": true}`.

WhatsApp is **roadmap** — it needs the WhatsApp Business API (Meta) or Twilio
with business verification and pre-approved templates.

---

## 5. Scheduling the daily brief

**Demo (in-process):** in `backend/.env`
```env
INTEL_DAILY_ENABLED=true
INTEL_DAILY_HOUR=8   # server local hour
```
Runs a delivered brief for every connected account daily.

**Production (recommended):** keep `INTEL_DAILY_ENABLED=false` and trigger from
**GCP Cloud Scheduler** → `POST https://<your-backend>/api/intel/run` with a
JSON body per account. This survives restarts and multi-instance/serverless
(Cloud Run) deploys, where an in-process scheduler would double-fire or die.

---

## 6. API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/intel/oauth/start` | Returns the Google auth URL |
| GET | `/api/intel/oauth/callback` | OAuth redirect target (stores tokens) |
| GET | `/api/intel/accounts` | List connected accounts |
| POST | `/api/intel/run` | Run a brief (`account_id` or `channels[]`, `deliver`) |
| GET | `/api/intel/brief/latest` | Most recent stored brief |
