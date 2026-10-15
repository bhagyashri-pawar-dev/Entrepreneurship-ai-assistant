# Entrepreneurship AI Assistant
> **"Turn Your Ideas Into Action"**  
> **Academic Project:** Third-Year (TE) Computer Engineering — Artificial Intelligence (AI) CIE-3 Project

---

## 📌 Project Overview
The **Entrepreneurship AI Assistant** is a full-stack, intelligent web application developed to empower college students, aspiring student founders, and early-stage innovators in solving real-world business challenges. 

Instead of generic motivational quotes, the system offers **pragmatic, grounded, and actionable guidance**: validating problem statements, planning bootstrapped college budgets, navigating Indian government startup grants (like Startup India Seed Fund, DST NIDHI, Atal Incubation Centres), designing go-to-market strategies, and structuring 10-slide investor pitch decks.

It features complete **Bilingual Support (English & Marathi - मराठी)** to support regional innovators across Maharashtra and India.

---

## 🚀 Key Features

1. **AI Entrepreneurship Advisor Chat**:
   - Conversational assistant with real-time **Server-Sent Events (SSE)** streaming.
   - Grounded anti-hallucination rules: differentiates verified facts from estimated costs.
   - Built-in speech-to-text dictation (Web Speech API).
   - Export chat transcript to Markdown (`.md`) or clear conversation anytime.

2. **Startup Idea Generator**:
   - Generates 3 tailored startup concepts based on user interests, technical skills, budget limits (₹0–₹1L+), and location.

3. **Business Idea Validator**:
   - Evaluates problem severity, identifies direct/indirect competitors, and formulates 6 customer survey interview questions with an objective verdict (GREEN, YELLOW, RED).

4. **Startup Budget & Runway Planner**:
   - Provides itemized one-time setup costs, monthly OPEX, marketing allocation, emergency buffers, and free student developer tiers (AWS Activate, GitHub Student Pack).

5. **Marketing Strategy Generator**:
   - Zero-cost campus growth playbooks, student ambassador referral schemes, social media content hooks, and cold outreach pitch scripts.

6. **Funding & Grants Guidance**:
   - Clear breakdown of Bootstrapping, College E-Cell grants, DST NIDHI-EIR, Startup India Seed Fund Scheme (SISFS), Atal Incubation Centres (AICs), and Angel Networks.

7. **Business Model & Unit Economics**:
   - Value proposition canvas, monetization channels, customer acquisition cost (CAC) vs lifetime value (LTV), and tiered pricing suggestions.

8. **10-Slide Pitch Deck Generator**:
   - Formats a 10-slide outline ready for E-Cell hackathons and investor pitches, with one-click export.

9. **7-Day Startup Action Sprint**:
   - Day-by-day checklist (Day 1 problem discovery to Day 7 soft launch and acquiring the first 10 users).

10. **Bilingual Engine (English & Marathi - मराठी)**:
    - Dedicated toggle providing natural Marathi business terminology (उदा. 'व्यवसाय नियोजन', 'भांडवल', 'ग्राहक सर्वेक्षण', 'नफा-तोटा') with English technical terms in parentheses.

11. **Academic CIE-3 Project Dossier & Viva Guide**:
    - Built-in documentation modal containing system architecture, data flow diagrams, top viva questions & model answers, and GitHub upload checklist.

12. **Confetti Milestone Celebrations**:
    - Interactive particle celebration upon completing action plans and pitch decks.

---

## 🛠️ System Architecture & Tech Stack

```text
[ React 19 + TypeScript + Tailwind CSS 4 UI ] 
                  │  (User Input / Speech / Form Data)
                  ▼
[ Express API Gateway (server.ts) on Port 3000 ]
                  │  (Injects GEMINI_API_KEY from environment)
                  ▼
[ Google Gen AI TypeScript SDK (@google/genai) ]
                  │  (Model: gemini-3.8-flash)
                  ▼
[ Real-Time SSE Stream / Structured JSON Responses ] ➔ [ React Client ]
```

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, Vite Dev Middleware (or optional Python Flask).
- **AI Engine**: Google Gen AI SDK (`@google/genai`), Model `gemini-3.8-flash`.
- **Security**: Server-side API key isolation (`process.env.GEMINI_API_KEY`). No secrets exposed to client browser.

---

## 💻 Local Installation & Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or 20.x+)
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Clone or Download the Project
```bash
git clone https://github.com/<your-username>/entrepreneurship-ai-assistant.git
cd entrepreneurship-ai-assistant
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` in your code editor and insert your Gemini API Key:
```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
PORT=3000
```
> **Security Reminder:** The `.env` file is in `.gitignore` and must **never** be committed to GitHub.

### Step 4: Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🐍 Optional: Running with Python Flask Backend
If your college evaluation requires a Python Flask backend demonstration:
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python python_backend/app.py
   ```

---

## 📦 How to Upload this Project to GitHub

Follow these steps to upload the project cleanly to a public GitHub repository without exposing secrets:

1. **Verify `.gitignore`**:
   Make sure `.env`, `node_modules/`, and `venv/` are listed in `.gitignore`. (This repository already includes a pre-configured `.gitignore`).

2. **Initialize Git repository**:
   ```bash
   git init
   ```

3. **Stage all project files**:
   ```bash
   git add .
   ```

4. **Verify staged files (No `.env` or credentials should appear)**:
   ```bash
   git status
   ```

5. **Commit the project**:
   ```bash
   git commit -m "Initial commit: Entrepreneurship AI Assistant for AI CIE-3"
   ```

6. **Create a new repository on GitHub**:
   - Go to [GitHub.com](https://github.com/new).
   - Name it `entrepreneurship-ai-assistant`.
   - Set visibility to **Public**.
   - Do **NOT** initialize with README or license (you already have them).

7. **Push your code**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/entrepreneurship-ai-assistant.git
   git push -u origin main
   ```

---

## 🚀 Deployment Instructions

### Option 1: Google Cloud Run (Recommended for AI Studio)
- When hosted on Google Cloud Run, set `GEMINI_API_KEY` in Cloud Run Environment Variables or Secret Manager.
- Port is automatically handled via `PORT=3000`.

### Option 2: Render / Railway
1. Connect your GitHub repository.
2. Build Command: `npm run build`
3. Start Command: `npm run start`
4. Add Environment Variable:
   - Key: `GEMINI_API_KEY`
   - Value: `Your_Gemini_API_Key`

### Option 3: Vercel
1. Import repository on Vercel.
2. Set Framework Preset to **Vite**.
3. Add `GEMINI_API_KEY` in the Environment Variables section.

---

## 🎓 Academic Viva Questions & Answers (CIE-3 Prep)

* **Q1: What problem does this project solve?**  
  *Answer:* College students with innovative ideas often fail due to lack of market validation, poor budgeting, and ignorance of funding avenues. This AI assistant provides structured, realistic guidance tailored to student realities.
* **Q2: Why is the Gemini API called from `server.ts` rather than the browser?**  
  *Answer:* To prevent API key leakage. Calling LLMs directly from browser JavaScript exposes credentials in client bundles and network traffic.
* **Q3: How does the application avoid AI hallucination in financial planning?**  
  *Answer:* System prompt engineering enforces grounding: the model states all baseline assumptions, distinguishes estimates from verified rates, and provides practical methods for students to conduct field interviews.
* **Q4: How does Server-Sent Events (SSE) streaming benefit the user experience?**  
  *Answer:* Rather than waiting 5–10 seconds for a full generation, tokens stream as they are generated by `gemini-3.8-flash`, creating a responsive interface.

---

## 📄 Academic Project Details
- **Subject:** Artificial Intelligence (AI)
- **Evaluation:** Continuous Internal Evaluation 3 (CIE-3)
- **Class:** Third-Year (TE) Computer Engineering
- **Academic Year:** 2026-2027
