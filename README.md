<p align="center">
  <h1 align="center">🎬 AK Productions — Studio OS</h1>
  <p align="center">
    <strong>The AI-Native Film Production Platform</strong><br/>
    An agentic AI system that orchestrates autonomous, multimodal agents to power every stage of film & TV production.
  </p>
  <p align="center">
    <a href="./PITCH.md"><strong>📄 Startup Pitch</strong></a> · 
    <a href="./ARCHITECTURE.md"><strong>🏗 Architecture</strong></a> · 
    <a href="./GCP_DEPLOYMENT.md"><strong>🚀 GCP Deployment</strong></a> · 
    <a href="./LIP_READING_PROPOSAL.md"><strong>👄 Lip-Reading</strong></a> · 
    <a href="./DANCE_CHOREOGRAPHY_PROPOSAL.md"><strong>🕺 Dance Choreography</strong></a> · 
    <a href="#getting-started"><strong>📦 Getting Started</strong></a>
  </p>
</p>

---

## What is AK Productions?

AK Productions is a **multi-agent AI platform** for film & television production. Instead of one monolithic chatbot, it deploys a network of **6 specialized AI agents** — each purpose-built for a specific production workflow — that share a persistent PostgreSQL knowledge base.

The platform's flagship capability is its **Multimodal Data Ingestion Engine**: paste a YouTube URL, and the system will download the video, feed it to **Google Gemini 2.5 Pro** (via Vertex AI), and automatically generate a structured, trilingual screenplay — complete with actor timestamps, scene topography, and camera angle descriptions.

> **Target Submission:** [Google for Startups: AI Agents Challenge 2026](https://devpost.com) — Deadline June 5, 2026

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎬 **Multimodal Video Analysis** | Download YouTube videos and feed them directly to Gemini 2.5 Pro. The model watches the video and extracts dialogue, actor sequences, scene layouts, and camera angles — all in one pass. |
| 🌐 **Trilingual Script Output** | Every line of dialogue is structured in **Urdu Script (اردو)**, **Roman Urdu**, and **English** simultaneously. |
| 🔀 **Model-Agnostic AI** | Switch between **OpenAI GPT-4o-mini** and **Google Gemini 2.5 Pro** directly from the UI. Use the right model for the right job. |
| 📚 **Persistent Script Library** | All extracted screenplays are saved to PostgreSQL. Browse, search, and revisit any script from the Library dashboard. |
| 🖥 **Studio Script Viewer** | Split-screen view: embedded YouTube player on the left, synced screenplay on the right. Read the script as you watch the scene. |
| ⏱ **Configurable Duration** | Don't download a 2-hour movie to test one scene. Set a duration limit (e.g., first 5 minutes) from the UI. |
| 🤖 **6 Specialized Agents** | IP Discovery, Script Breakdown, Acting Coach, Continuity, Auto-Dubbing, and Data Ingestion — each with its own logic, prompts, and data pipeline. |
| 📱 **Cross-Platform** | Web (Next.js), iOS & Android (Expo React Native), all hitting the same FastAPI backend. |

---

## 🏗 Architecture

```mermaid
flowchart TD
    subgraph Clients
        W["🖥 Next.js Web Dashboard"]
        M["📱 Expo React Native Mobile"]
    end

    subgraph Backend["FastAPI Backend"]
        API["API Gateway"]
        DB[("PostgreSQL")]

        subgraph Agents["AI Agent Network"]
            DI["📥 Data Ingestion"]
            IP["🔍 IP Discovery"]
            SB["📄 Script Breakdown"]
            AC["🎭 Acting Coach"]
            CA["🎯 Continuity"]
            AD["🌍 Auto-Dubbing"]
        end
    end

    subgraph AI["AI Model Layer"]
        G["Gemini 2.5 Pro — Vertex AI"]
        O["OpenAI GPT-4o-mini"]
    end

    subgraph Data["Data Sources"]
        YT["YouTube — yt-dlp"]
    end

    W <-->|REST| API
    M <-->|REST| API
    API <--> DB
    API --> Agents
    DI --> YT
    DI --> G
    DI --> O
    IP --> O
    SB --> O
    AC --> G
    CA --> G
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Web** | Next.js 16 · React 19 · Tailwind CSS v4 · Framer Motion |
| **Mobile** | Expo SDK 56 · React Native · Moti · Reanimated |
| **Backend** | FastAPI · Python 3.14 · Pydantic · SQLAlchemy |
| **Database** | PostgreSQL |
| **AI (Multimodal)** | Google Gemini 2.5 Pro (Developer API; Vertex AI optional) |
| **AI (Text)** | OpenAI GPT-4o-mini (model selectable at runtime) |
| **Video Pipeline** | yt-dlp · YouTube Transcript API |
| **Infra** | Google Cloud Platform · Vertex AI (optional) |
| **Design** | Monochrome enterprise design system · Dark/Light theme · `next-themes` |

---

## 🤖 AI Agents

### 📥 Data Ingestion Agent
Paste a YouTube URL. Choose between **Fast Transcript Extraction** (subtitles + LLM) or **Deep Video Analysis** (MP4 download + Gemini vision). Select your preferred AI model and duration limit. The agent structures the output as a trilingual screenplay and persists it to PostgreSQL.

### 🔍 IP Discovery Agent
Specify a genre and era. The agent uses LLMs to surface forgotten intellectual properties and generate modern remake pitches with audience fit scores.

### 📄 Script Breakdown Agent
Upload a screenplay PDF. The agent parses it and extracts cast requirements, props, wardrobe, vehicles, VFX needs, and estimated budget.

### 🎭 Acting Coach Agent
Upload a `.wav` audition recording. The agent extracts pitch variance, tempo, emotional mapping, and clarity metrics to provide objective performance feedback.

### 🎯 Continuity Agent
Upload frames from different takes. Computer vision compares them to flag inconsistencies in props, lighting, and wardrobe.

### 🌍 Auto-Dubbing Agent
Transcribes audio, translates it via LLM, and generates synthesized voice dubs for foreign language markets.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+
- **Python** 3.14+
- **PostgreSQL** 15+
- **Google Cloud SDK** (authenticated via `gcloud auth application-default login`)

### 1. Clone & Configure

```bash
git clone https://github.com/your-repo/AK_Productions.git
cd AK_Productions
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ak_productions
OPENAI_API_KEY=sk-your-openai-key

# Gemini Developer API key — required for multimodal video analysis.
# Get one free at https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-key

# Comma-separated frontend origins allowed to call the API
CORS_ORIGINS=http://localhost:3000

# Optional: set true to use Vertex AI instead (text only — video analysis is
# disabled on Vertex because the Files API is unavailable there)
# GEMINI_USE_VERTEX=true
# GCP_PROJECT=your-gcp-project
```

And `frontend/.env.local` (points the web app at the backend):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Models are configurable at runtime** from the **Admin** panel (`/admin`) — no redeploy needed. Defaults live in `backend/core/config.py`.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
The API server starts at `http://localhost:8000`.

### 3. Web Dashboard

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

### 4. Mobile App

```bash
cd mobile_app
npm install
npx expo start
```

---

## 📂 Project Structure

```
AK_Productions/
├── frontend/                   # Next.js 16 Web Dashboard
│   └── src/app/
│       ├── data-ingestion/     # YouTube ingestion UI + config panel
│       ├── library/            # Script library + [id] detail viewer
│       ├── ip-discovery/       # IP Discovery agent UI
│       ├── acting-coach/       # Acting Coach agent UI
│       ├── script-breakdown/   # Script Breakdown agent UI
│       ├── continuity-agent/   # Continuity agent UI
│       ├── auto-dubbing/       # Auto-Dubbing agent UI
│       └── pipeline/           # Multi-step pipeline wizard
├── backend/                    # FastAPI Backend
│   ├── api/routes.py           # All API endpoints
│   ├── core/
│   │   ├── database.py         # PostgreSQL connection
│   │   └── models.py           # SQLAlchemy models
│   └── ai_agents/
│       ├── data_ingestion/
│       │   ├── youtube_scraper.py      # Transcript extraction + LLM
│       │   ├── video_downloader.py     # yt-dlp video download
│       │   └── gemini_analyzer.py      # Gemini 2.5 Pro multimodal
│       ├── pre_production/
│       │   ├── ip_discovery.py
│       │   └── script_breakdown.py
│       ├── casting/
│       │   └── acting_coach.py
│       ├── production/
│       │   └── continuity_agent.py
│       └── post_production/
│           └── auto_dubber.py
├── mobile_app/                 # Expo React Native App
├── PITCH.md                    # 📄 Startup pitch document
└── README.md                   # This file
```

---

## 📄 Startup Pitch

For the full startup narrative — problem statement, market opportunity ($370B), competitive differentiation, and roadmap — see **[PITCH.md](./PITCH.md)**.

---

## 📸 Screenshots

> _Coming soon: Data Ingestion Engine, Library Dashboard, Studio Script Viewer._

---

## 🗺 Roadmap

- [x] Multi-agent FastAPI architecture (6 agents)
- [x] YouTube ingestion pipeline (yt-dlp + transcripts)
- [x] Gemini 2.5 Pro multimodal video analysis (Vertex AI)
- [x] Model-agnostic UI (OpenAI ↔ Gemini switcher)
- [x] PostgreSQL persistence + searchable Library
- [x] Studio Script Viewer (split-screen video + screenplay)
- [x] Dark/Light theme system
- [x] Acting Coach v2 (compare performance vs. extracted scripts)
- [ ] Batch ingestion (ingest full drama series)
- [ ] Real-time collaborative annotations
- [ ] SaaS multi-tenant deployment

---

## 🚀 Future Expansion Proposals

We are actively researching and designing state-of-the-art expansion capabilities for Studio OS:
1. **[AI Lip-Reading & Dialogue Reconstruction](./LIP_READING_PROPOSAL.md)**: Generate transcripts and synced dialogue tracks from actor lip movements in silent videos or live streams.
2. **[AI Music-to-Motion Dance Choreography](./DANCE_CHOREOGRAPHY_PROPOSAL.md)**: Automatically suggest dynamic dance choreographies matching any music track.

---

## License

MIT

---

<p align="center">
  <strong>AK Productions</strong> — Where AI meets cinema.<br/>
  <em>Built with ❤️ using Gemini 2.5 Pro, OpenAI, FastAPI, Next.js, and PostgreSQL.</em>
</p>
