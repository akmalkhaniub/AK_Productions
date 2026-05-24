# AK_Productions Studio OS 🎬

A next-generation, premium-grade AI orchestration platform for film and television production. AK_Productions unifies the entire lifecycle of pre-production, production, and post-production into a single, cohesive ecosystem powered by advanced AI models.

## 🏗 System Architecture

The platform operates as a monorepo consisting of three distinct layers:

```mermaid
graph TD
    subgraph Clients
        W[Next.js Web Dashboard]
        M[Expo React Native Mobile App]
    end

    subgraph Backend Services
        API[FastAPI Server]
        DB[(PostgreSQL Database)]
        
        subgraph AI Agents
            A1[IP Discovery Agent]
            A2[Acting Coach Agent]
            A3[Auto-Dubber Agent]
            A4[Script Breakdown Agent]
            A5[Continuity Agent]
        end
    end

    subgraph External LLMs
        OAI[OpenAI GPT-4 Turbo]
    end

    W <-->|REST / JSON| API
    M <-->|REST / JSON| API
    API <--> DB
    API <--> AI Agents
    A1 <--> OAI
    A4 <--> OAI
```

## 🤖 AI Agent Modules

The platform is designed around 5 core AI agents:

1. **IP Discovery (Pre-Production)**: Scans historical databases to find forgotten IPs that match modern trends. Integrates with OpenAI to generate modern loglines and twists.
2. **Script Breakdown (Pre-Production)**: Parses PDF scripts to automatically extract casting requirements, props, wardrobe, and estimated budgets. 
3. **Acting Coach (Casting)**: Analyzes audio files of actor performances, providing emotion mapping, pitch variance, and clarity scores.
4. **Continuity Agent (Production)**: Uses computer vision to analyze frames across scenes, ensuring props, lighting, and wardrobe remain consistent.
5. **Auto-Dubbing (Post-Production)**: Transcribes, translates, and generates lip-synced audio clones in foreign languages for global distribution.

## 🚀 Getting Started

Ensure you have Node.js, Python 3.14+, and PostgreSQL installed on your machine.

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create your `.env` file and add your `DATABASE_URL` and `OPENAI_API_KEY`.
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server: `uvicorn main:app --reload`

### 2. Web Dashboard Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

### 3. Mobile App Setup
1. Navigate to the mobile directory: `cd mobile_app`
2. Install dependencies: `npm install`
3. Launch the Expo bundler: `npx expo start`
4. Run on an emulator using `npm run android` or `npm run ios`.

## 🎨 Design System
The frontend and mobile applications share a unified design language centered around **Glassmorphism**, featuring dark neon cinematic accents (`#020617` backgrounds with `#22d3ee` and `#c084fc` neon highlights) to provide a premium, state-of-the-art experience.
