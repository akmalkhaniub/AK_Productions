# 04 · Model Configuration

## Problem

Model IDs (`gemini-1.5-pro`, `gpt-4o-mini`) and the GCP project were hardcoded
across 5+ agent files. Upgrading a model meant editing several files; switching
a model for an experiment meant a redeploy.

## Decision: config as data, not code

- **`core/config.py`** — single source of truth, env-driven with sane defaults
  (models, GCP project/location, CORS origins, OAuth, SMTP/Slack, scheduler).
  Secrets live here / in env and are **never** exposed via the API.
- **`AppSetting` table + `core/settings_service.py`** — runtime-overridable
  settings (which model each agent uses, ingestion/intel provider), cached
  in-process and refreshed on write.
- **Admin panel** (`/admin`) + `GET/PUT /api/admin/settings` — change models
  **live, no redeploy**, with whitelist validation against allowed options.

## Resolution order

`DB setting (admin) → env var → hardcoded default in config.py`

## Gemini backend choice

`GEMINI_USE_VERTEX` toggles Vertex AI vs the Developer API. Default is the
**Developer API**, because the Files API (needed for video upload) is only
available there — Vertex disables video analysis. See
[07-decision-log](./07-decision-log.md).

## Defaults

`gemini-2.5-pro` (multimodal), `gpt-4o-mini` (text). The resilient
[LLM chain](./03-llm-fallback-chain.md) may still pick a cheaper provider first
for single-shot calls.
