# 🎬 AK Productions — Studio OS

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16%20%7C%20App%20Router-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Expo-SDK%2056-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 56">
  <img src="https://img.shields.io/badge/FastAPI-Python%203.14-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI Python 3.14">
  <img src="https://img.shields.io/badge/Google%20Gemini-2.5%20Pro-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini 2.5 Pro">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
</p>

<p align="center">
  <strong>The AI-Native Film Production Platform</strong><br/>
  An agentic AI system that orchestrates autonomous, multimodal agents to power every stage of film & TV production.
</p>

<p align="center">
  <a href="./PITCH.md"><strong>📄 Startup Pitch</strong></a> · 
  <a href="./docs/README.md"><strong>📚 Design Docs</strong></a> · 
  <a href="./ARCHITECTURE.md"><strong>🏗 Architecture</strong></a> · 
  <a href="./GCP_DEPLOYMENT.md"><strong>🚀 GCP Deployment</strong></a> · 
  <a href="./LIP_READING_PROPOSAL.md"><strong>👄 Lip-Reading</strong></a> · 
  <a href="./DANCE_CHOREOGRAPHY_PROPOSAL.md"><strong>🕺 Dance Choreography</strong></a> · 
  <a href="#getting-started"><strong>📦 Getting Started</strong></a>
</p>

---

## 📽️ What is Studio OS?

**Studio OS** by AK Productions is an AI-powered film and television production operating system. Instead of a single conversational bot, it deploys a collaborative network of **7 specialized autonomous agents** sharing a persistent PostgreSQL knowledge base to analyze video, draft scripts, evaluate actor performances, and generate dubbing audio.

The platform's flagship capability is its **Multimodal Data Ingestion Engine**: input a YouTube URL, and the system automatically downloads the clip, runs deep video parsing via **Google Gemini 2.5 Pro** (Vertex AI), and outputs a structured, trilingual screenplay synced with actor timestamps, scene topography, and camera angles.

> 🏆 **Target Submission:** [Google for Startups: AI Agents Challenge 2026](https://devpost.com)

---

## 🎨 System Architecture

Studio OS separates user control panels (web and mobile apps) from the Python agent coordinator, routing queries through a type-safe FastAPI gateway to models and external scrapers.

```mermaid
graph TD
    classDef client fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef gateway fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef agent fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#9a3412;
    classDef model fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef data fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    W["🖥 Next.js 16 Web Dashboard"] -->|REST / JSON| API["API Gateway (FastAPI)"]
    M["📱 Expo React Native Mobile"] -->|REST / JSON| API
    
    API <--> DB[("PostgreSQL Database")]
    API --> AgentSwarm
    
    subgraph AgentSwarm [AI Agent Network]
        DI["📥 Data Ingestion"]
        IP["🔍 IP Discovery"]
        SB["📄 Script Breakdown"]
        AC["🎭 Acting Coach"]
        CA["🎯 Continuity"]
        AD["🌍 Auto-Dubbing"]
    end
    
    DI -->|yt-dlp| YT[YouTube Data Stream]
    DI -->|Multimodal Vision| Gemini["Google Gemini 2.5 Pro"]
    DI -->|Text Ingestion| GPT["OpenAI GPT-4o-mini"]
    
    IP --> GPT
    SB --> GPT
    AC --> Gemini
    CA --> Gemini
    AD --> Gemini

    class W,M client;
    class API gateway;
    class DI,IP,SB,AC,CA,AD agent;
    class Gemini,GPT model;
    class YT,DB data;
    
    style AgentSwarm fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,stroke-dasharray: 5 5;
```

---

## ✨ Key Platform Features

| Feature | Technical Capability |
|---|---|
| 🎬 **Multimodal Video Analysis** | Downloads clips via `yt-dlp` and runs video-frame scanning via Gemini 2.5 Pro to extract dialogue, character presence, scene layout, and camera angles in one pass. |
| 🌐 **Trilingual Script Output** | Formats screenplays with dialogue simultaneously in **Urdu Script (اردو)**, **Roman Urdu**, and **English** for international co-productions. |
| 🔀 **Runtime Model Switcher** | Hot-swaps backend generation routing between **OpenAI GPT-4o-mini** and **Google Gemini 2.5 Pro** directly from the UI settings panel. |
| 🖥 **Studio Script Viewer** | Interactive, synced split-screen display: YouTube video player on the left panel, time-coded screenplay on the right panel. |
| ⏱ **Configurable Duration Limits** | Restricts video downloads (e.g., first 5 minutes) to run quick testing and save API token costs. |
| 📡 **Studio Intelligence Agent** | Monitors designated channels using feed aggregators and transcript scraping to generate daily production briefs delivered to email/Slack. |
| 📱 **Full Cross-Platform Coverage** | Complete web dashboard (Next.js 16) and cross-platform mobile app (Expo React Native 56) hitting a single FastAPI backend. |

---

## 🤖 The 7 Specialized Agents

*   **📥 Data Ingestion Agent**: Paste a video URL to execute **Fast Transcript Extraction** or **Deep Video Analysis** (MP4 video download + Gemini vision processing). Screenplays are outputted in trilingual form and saved to PostgreSQL.
*   **🔍 IP Discovery Agent**: Surfaces public domain or forgotten properties based on genre/era inputs, generating modern adaptation pitches with target audience analysis.
*   **📄 Script Breakdown Agent**: Parses uploaded screenplay PDFs to extract cast structures, prop lists, wardrobe settings, locations, and estimated production budget.
*   **🎭 Acting Coach Agent**: Analyzes `.wav` audition uploads (pitch variance, emotional tempo, clarity) to provide objective vocal and performance feedback.
*   **🎯 Continuity Agent**: Scans video frames from consecutive takes to identify continuity errors in props, wardrobe, or lighting setup.
*   **🌍 Auto-Dubbing Agent**: Transcribes dialogue, translates the text, and compiles synthesized voice dubs for target international distribution markets.
*   **📡 Studio Intelligence Agent**: Scans industry channels and compiles automated summaries of trending topics and content releases.

---

## 🛠 Tech Stack

-   **Frontend (Web)**: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion
-   **Frontend (Mobile)**: Expo SDK 56 · React Native · Moti · Reanimated
-   **Backend**: FastAPI (Python 3.14) · Pydantic · SQLAlchemy ORM
-   **Database**: PostgreSQL
-   **AI Providers**: Google Gemini 2.5 Pro (Vertex AI / Developer API) · OpenAI GPT-4o-mini
-   **Media Processing**: `yt-dlp` · YouTube Transcript API · FFmpeg

---

## 📚 Design & Architecture Docs

Detailed design plans and decision records are maintained inside the [`docs/`](./docs/README.md) directory:

-   [Architecture Overview](./docs/01-architecture.md) — System boundaries, agent specifications, database schemas.
-   [Agentic Design Patterns](./docs/02-agentic-patterns.md) — Tool-use loops, human-in-the-loop validation, and reflection.
-   [LLM Fallback Chain](./docs/03-llm-fallback-chain.md) — Multi-model routing logic and cost-balancing rules.
-   [Model Configurator](./docs/04-model-configuration.md) — Dynamic runtime model configuration.
-   [Studio Intelligence](./docs/05-studio-intelligence.md) — YouTube intelligence feeds and scraping pipelines.
-   [Design Systems](./docs/06-design-system.md) — Theme configurations (`next-themes`).
-   [Decision Logs (ADRs)](./docs/07-decision-log.md) — Architectural Decision Records.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+
- **Python** 3.14+
- **PostgreSQL** 15+
- **GCP SDK** (Authenticated for Vertex AI, if using Cloud Models)

### 1. Configure Environments
Clone the repository:
```bash
git clone https://github.com/akmalkhaniub/AK_Productions.git
cd AK_Productions
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ak_productions
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key (Get one free at https://aistudio.google.com/apikey)
CORS_ORIGINS=http://localhost:3000
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Startup the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
API runs at `http://localhost:8000`.

### 3. Startup the Web Panel
```bash
cd ../frontend
npm install
npm run dev
```
Dashboard runs at `http://localhost:3000`.

### 4. Startup the Mobile Client
```bash
cd ../mobile_app
npm install
npx expo start
```

---

## 🗺 Platform Roadmap

- [x] Multi-agent FastAPI backend framework.
- [x] Ingestion pipeline (transcripts, subtitles, and metadata extraction).
- [x] Multimodal video frame parsing using Gemini 2.5 Pro.
- [x] Split-screen Studio Script Viewer (synced video player + screenplay).
- [x] Multi-theme dark mode system.
- [x] Acting Coach audition analysis (pitch, tempo, tone checks).
- [ ] Batch processing for full drama series episodes.
- [ ] Real-time script annotations and comments feed.
- [ ] SaaS multi-tenant billing and subscription gate.

---

## 🚀 Advanced R&D Proposals

We are actively designing state-of-the-art expansion modules for the Studio OS:
1. **[AI Lip-Reading & Speech Reconstruction](./LIP_READING_PROPOSAL.md)**: Generating synced speech tracks from silent video footage.
2. **[AI Music-to-Motion Choreography](./DANCE_CHOREOGRAPHY_PROPOSAL.md)**: Designing automated, audio-synced choreography timelines.

---

## 🏁 License & Contact

Distributed under the MIT License. See `LICENSE` for more information.

*Developer: Akmal Khan*  
*Email: akmal.shahbaz@iub.edu.pk*  
*Repository Link: [https://github.com/akmalkhaniub/AK_Productions](https://github.com/akmalkhaniub/AK_Productions)*
