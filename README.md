# 🧠 InterviewAI — Enterprise-Grade Virtual Interviewer

An advanced, full-stack AI interview simulation platform built with **React**, **FastAPI**, and **Framer Motion**. Driven by Gemini/OpenAI, it models industry-grade developer interviews with adaptive follow-up questioning, resume personalization, visual progress analytics, and automated study roadmaps.

Designed with a professional, minimal dark aesthetic inspired by Vercel, Linear, and Stripe.

---

## 🚀 Key Product Offerings

### 📄 Resume Intelligence & Setup Customization
* **Resume Detail Extractor**: Upload PDF/TXT resumes to dynamically parse candidate skills, technologies, and projects.
* **Personalized Context**: Automatically calibrates the interview generator to focus on the candidate's highlighted experience.
* **Tier Toggles**: Instantly configure standard tiers (Beginner, Intermediate, Advanced) and engineering-specific levels (Fresher, SDE-1, SDE-2).

### 💬 Adaptive Interview Engine
* **Dynamic Follow-Up Questioning**: The AI analyzer monitors response transcripts and asks precise follow-up questions when specific tech stacks or paradigms are mentioned (e.g., memory leaks, caching strategies, containerization).
* **High-Fidelity Audio Mode**: Record or speak answers using a Speech-to-Text layer featuring interactive equalizer waveforms.

### 🌟 Zero-Barrier Guest Demo
* **Auth-Free Sandbox**: A 3-question offline trial allows prospective users to test the live interview room, audio indicators, and quantitative reporting page without creating an account.

### 📊 SaaS Dashboard & Gamified Retention
* **Live Analytics**: Visual radar and trend charts mapping technical, communication, and confidence metrics.
* **Gamified Milestones**: Practice streak counters, weekly goal tracking meters, and sliding badge achievement alerts.
* **Session Explorer**: Complete query tools to search, filter, and review historical mock sessions.

### 📖 7-Day Study Timelines & Replays
* **Personalized Roadmaps**: Generates custom study calendars focusing on the candidate's lowest score categories.
* **Question-by-Question Replay**: Inspect AI evaluations, quantitative ratings, strengths, and areas of improvement for every single answer.

---

## 🎨 Motion Design Principles & Animations
* **Vercel-inspired Page Transitions**: Fade + translation page layouts (`250ms`) with smooth, spring-loaded active sidebar highlighting.
* **Viewport-Triggered Reveals**: Chronological workflow connectors draw paths and count metrics up only when scrolled into view.
* **Zero Layout Flickering**: Spinners replaced with realistic, shimmering container skeleton templates.
* **Fast and Responsive**: UI transitions are capped at `150ms` (Fast) or `250ms` (Normal) to ensure animations never block user flows.

---

## 📁 Repository Structure

```
Ai_virtual_interviewer/
├── netlify.toml                # Netlify SPA Deployment configuration
├── interview-ai/
│   ├── frontend/               # React + Vite + Tailwind CSS
│   │   ├── src/
│   │   │   ├── context/        # Auth & Interview states
│   │   │   ├── pages/          # Landing, Dashboard, Setup, HUD, Report, History, Profile
│   │   │   └── index.css       # Core layout and premium animations stylesheet
│   │   ├── tailwind.config.js  # Theme variables matching SaaS color palette
│   │   └── package.json
│   │
│   └── backend/                # Python FastAPI App
│       ├── app/
│       │   ├── routes/         # Auth, User Analytics, and Session routes
│       │   ├── services/       # Gemini and OpenAI LLM drivers
│       │   ├── models.py       # Pydantic schemas and database proxy fallback
│       │   └── __init__.py
│       ├── main.py             # Server runner configuration
│       └── requirements.txt    # Stable dependencies listing
```

---

## ⚡ Setup & Launch

### Prerequisites
* **Node.js**: v18+
* **Python**: v3.11.9 (automatically specified via `.python-version`)
* **Databases**: MongoDB (automatically falls back to a transparent local JSON DB if MongoDB is unavailable)

### 1. Server Configuration (Backend)
Navigate to the backend directory, configure the environment, and spin up the server:

```bash
cd interview-ai/backend

# Create virtual environment and activate
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
* Interactive Swagger documentation is available at: `http://localhost:8000/docs`

### 2. Client Configuration (Frontend)
Open a new terminal window to build and run the web client:

```bash
cd interview-ai/frontend

# Install dependencies
npm install

# Start Vite hot-reload server
npm run dev
```
* Open your browser and navigate to: `http://localhost:5173`

---

## 🔑 Environment Secrets Reference

### Backend (`interview-ai/backend/.env`)
Create a `.env` file inside the backend folder containing:
```ini
SECRET_KEY=highly-secure-jwt-signing-key-phrase
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
AI_PROVIDER=gemini # Choose: gemini | openai
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj-...
MONGODB_URL=mongodb://localhost:27017 # Optional (falls back to local JSON)
MONGODB_DB_NAME=interview_ai
DEBUG=true
```

### Frontend (`interview-ai/frontend/.env`)
Create a `.env` file inside the frontend folder:
```ini
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Deployment

### Backend (Render Web Services)
1. Set the **Root Directory** to `interview-ai/backend`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Add environment variables: `SECRET_KEY`, `AI_PROVIDER`, `GEMINI_API_KEY`, and `CORS_ALLOWED_ORIGINS` (pointing to your Vercel/Netlify URL).

### Frontend (Netlify or Vercel)
This repository includes a [`netlify.toml`](file:///Users/chinna/Ai_virtual_interviewer/netlify.toml) configured to build and deploy SPA routes seamlessly:
1. Base directory: `interview-ai/frontend`
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environmental variables: `VITE_API_URL` (pointing to your Render API instance).

---

## 📄 Pre-seeded Demo Credentials
A demo user profile is pre-seeded in the database fallback to enable instant evaluation:
* **Email**: `demo@example.com`
* **Password**: `password123`
