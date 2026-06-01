# 05 · Studio Intelligence

A daily agentic brief of what dropped across the YouTube channels a studio
tracks — reframed from a generic "summarize my subscriptions" idea into
**competitive/industry intelligence** so it fits a production platform.

Full setup steps (OAuth client, delivery, scheduling) live in
[../STUDIO_INTEL.md](../STUDIO_INTEL.md). This doc records the design choices.

## Key design choices

- **RSS for "what's new", OAuth only for "what to track".** New uploads come
  from each channel's free RSS feed (`youtube.com/feeds/videos.xml?channel_id=`)
  — **no API quota**. OAuth (`youtube.readonly`) is used once to fetch the
  subscription list. This dodges the 10k-unit/day Data API budget (a single
  `search.list` is 100 units).
- **Two entry paths.** Manual channel list (no login — demoable immediately) and
  Connect-YouTube (auto-pulls subscriptions).
- **Agentic summarizer.** The agent decides which uploads are worth transcribing
  before composing the brief (`run_tool_loop`), with a deterministic Gemini path
  as an alternative provider.
- **Delivery: email + Slack.** WhatsApp is roadmap only (needs WhatsApp Business
  API / Twilio with template approval).
- **Scheduling.** Optional in-process APScheduler for the demo; production should
  use an external trigger (GCP Cloud Scheduler → `POST /api/intel/run`).

## Constraints to know

- `youtube.readonly` is a **restricted** scope: public use needs Google OAuth
  verification; test-user mode (~100 users) is fine for the demo.
- OAuth tokens are stored as-is in `ConnectedAccount` for the MVP — encrypt at
  rest before any public launch.
