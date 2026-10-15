import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client initialization with mandatory User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    model: DEFAULT_MODEL,
    academicContext: 'Third-Year Computer Engineering AI CIE-3 Project',
  });
});

// System instructions for the Entrepreneurship AI Assistant
function getSystemInstruction(language: string = 'en', toolContext?: string) {
  const isMarathi = language === 'mr';

  const baseInstruction = `
You are the "Entrepreneurship AI Assistant", an intelligent advisor built for a Third-Year Computer Engineering AI CIE-3 academic project.
Your mission is to guide college students, aspiring student founders, and early-stage entrepreneurs in turning real-world ideas into sustainable, viable startups.

CRITICAL REAL-WORLD PRINCIPLES:
1. Provide actionable, realistic, step-by-step guidance rather than generic motivational fluff or platitudes.
2. Distinguish estimated figures from verified facts. Always state assumptions (e.g. "Estimated range based on typical Indian tier-1/2 college campus costs: ₹5,000 - ₹15,000").
3. Do NOT invent live market data, false company metrics, or imaginary investors. When real-world data requires primary field validation, explicitly instruct the user on how to gather it (e.g., surveying 30 college students, contacting local vendor).
4. If the user's idea or query is vague, ask 1-2 focused clarifying questions before making broad assumptions.
5. Highlight legal, ethical, and college student constraints (budget limits, time commitments, campus intellectual property policies, MSME/Udyam registration).
6. Focus on practical execution: low-code/no-code MVPs, WhatsApp community pilot runs, landing pages with Google Forms, college incubator support (e.g. Startup India Seed Fund, DST NIDHI, AICs).

LANGUAGE DIRECTIVE:
${
  isMarathi
    ? `You MUST respond in clean, natural, grammatically correct Marathi (मराठी).
Use standard Marathi entrepreneurship and business vocabulary (उदा. 'व्यवसाय नियोजन', 'भांडवल', 'ग्राहक समस्या', 'नफा-तोटा', 'बाजारपेठ संशोधन', 'प्रकल्प आराखडा').
Whenever a technical or startup industry term is better known in English (like MVP, Pitch Deck, Bootstrapping, CAC, LTV), mention the English word in parentheses alongside its Marathi explanation (उदा. 'किमान व्यवहार्य उत्पादन (MVP)', 'गुंतवणूक सादरीकरण (Pitch Deck)').`
    : `Respond in clear, accessible, structured English tailored for college students and tech entrepreneurs.`
}

${toolContext ? `ACTIVE TOOL CONTEXT:\n${toolContext}` : ''}
`;

  return baseInstruction.trim();
}

// 1. Interactive Chat Endpoint (Supports Streaming SSE)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, language = 'en', toolContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your key in the AI Studio Secrets panel or environment variables.',
      });
    }

    // Format chat history for Gemini API
    // Combine conversation into a structured contents array or formatted prompt
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let streamSuccess = false;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: getSystemInstruction(language, toolContext),
            temperature: 0.7,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        streamSuccess = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} stream attempt failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!streamSuccess) {
      throw lastError || new Error('All model stream candidates failed.');
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error?.message || 'Failed to generate response from Gemini AI.',
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          error: error?.message || 'Streaming interrupted.',
        })}\n\n`
      );
      res.end();
    }
  }
});

// 2. Structured Tools Generation Endpoint
app.post('/api/tools/generate', async (req: Request, res: Response) => {
  try {
    const { toolType, params, language = 'en' } = req.body;

    if (!toolType) {
      return res.status(400).json({ error: 'toolType is required.' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your key in the AI Studio Secrets panel.',
      });
    }

    const isMarathi = language === 'mr';
    let toolPrompt = '';

    switch (toolType) {
      case 'idea_generator':
        toolPrompt = `
Generate 3 distinct, highly realistic, college-friendly startup ideas based on:
- User Interests: ${params.interests || 'Technology, Campus life, Productivity'}
- Technical / Domain Skills: ${params.skills || 'Computer Engineering, Web & Mobile Development, AI/ML'}
- Available Budget: ${params.budget || '₹5,000 - ₹20,000 (Student Bootstrapped)'}
- Location & Target Market: ${params.location || 'College Campuses & Tier-2 Indian Cities'}

Format the output clearly for each idea:
1. Idea Name & Catchy Tagline
2. Problem Solved (Pain point experienced by actual users)
3. Target Customer Persona
4. MVP Tech Stack & First Prototype (realistic for engineering students)
5. Monetization Strategy (pricing and revenue stream)
6. Initial Budget Allocation (how to spend within the specified budget)
7. Viability Score (1-10) with key risk and mitigation.
`;
        break;

      case 'idea_validator':
        toolPrompt = `
Thoroughly validate this startup business idea:
Idea Summary: "${params.idea}"
Target Audience: "${params.targetAudience || 'College students and local merchants'}"
Proposed Solution: "${params.solution || 'Tech platform / automated service'}"

Provide a comprehensive, objective reality check:
1. Core Problem Statement Refinement (Is this a hair-on-fire problem or a nice-to-have?)
2. Customer Segment Breakdown (Early adopters vs mainstream)
3. Direct & Indirect Competitors to Research (Identify 3-4 existing Indian or global players and how to differentiate)
4. Field Validation Survey (Provide 6 specific, non-leading interview/survey questions to ask 25 prospective customers)
5. Flaws, Pitfalls & Regulatory / Practical Hurdles to watch out for
6. Verdict: GREEN (Ready for MVP), YELLOW (Needs pivot/refinement), or RED (High danger of failure) with clear justification.
`;
        break;

      case 'budget_planner':
        toolPrompt = `
Create a realistic startup budget and financial runway plan for:
- Startup Concept: "${params.concept}"
- Stage: "${params.stage || 'Pre-seed / MVP Launch'}"
- Total Capital Available: "${params.capital || '₹25,000'}"
- Target Runway: "${params.runway || '6 months'}"

Provide a structured financial plan:
1. One-Time Setup Costs (Domain, hosting, API quotas, basic branding, registration e.g. MSME Udyam)
2. Monthly Operational Expenses (Cloud/Firebase costs, tools, basic software, zero-cost student tiers)
3. Customer Acquisition & Marketing Budget (Low-cost campus marketing, stickers, student ambassadors, micro-ads)
4. Contingency & Buffer Reserve (Recommended emergency percentage)
5. Practical Bootstrapping Tips: Exact free tools, student GitHub packs, credits (AWS Activate, Google for Startups)
6. Runway Calculation & Break-Even Metric (How many paying users or transactions needed to break even).
`;
        break;

      case 'marketing_strategy':
        toolPrompt = `
Design an actionable marketing & user acquisition strategy for a student-led startup:
- Business: "${params.businessName || 'Student Startup'}"
- Product / Offering: "${params.productDescription}"
- Target Audience: "${params.targetAudience || 'University students, faculty, and local businesses'}"
- Marketing Budget: "${params.marketingBudget || '₹0 - ₹2,000 (Organic/Grassroots)'}"

Provide:
1. Zero-Cost Campus Launch Playbook (College WhatsApp groups, clubs, hackathons, hostel word-of-mouth)
2. Campus Ambassador / Referral Program Outline (Incentives without heavy cash)
3. Social Media & Content Strategy (Instagram reels, LinkedIn builder updates, Reddit/Twitter threads - 5 sample post hooks)
4. Cold Outreach & Direct Pitch Template (Email/DM script to pitch early adopters or local partners)
5. Conversion Funnel & First 100 Users Milestone Plan.
`;
        break;

      case 'funding_guidance':
        toolPrompt = `
Provide detailed, realistic funding options and government scheme roadmap for this stage:
- Startup Stage: "${params.stage || 'Idea / Prototype Stage'}"
- Industry / Domain: "${params.industry || 'EdTech / AI / College Campus Tech'}"
- Funding Required: "${params.amount || '₹1,00,000 - ₹5,00,000'}"
- Country / Region: "India (Focus on Student & College Schemes)"

Detail:
1. Bootstrapping vs External Capital: Should this team even raise right now?
2. College Incubation & Institutional Grants (E-Cell, DST NIDHI-EIR, TBI, Atal Incubation Centres)
3. Government Schemes & Subsidies (Startup India Seed Fund Scheme SISFS, MSME Idea Hackathon, BIRAC/TIDE 2.0 if applicable)
4. Angel Investors & Micro-VCs (When to approach, what traction is required)
5. Warning: Equity pitfalls, student loan traps, and dangerous investor terms to avoid.
`;
        break;

      case 'business_model':
        toolPrompt = `
Develop a robust business model and revenue roadmap for:
- Startup Idea: "${params.startupIdea || params.idea || params.concept || 'Student Innovation Venture'}"
- Customer Segment: "${params.customerSegment || params.targetAudience || 'B2C Students & B2B Campus Vendors'}"
- Pricing & Monetization Model: "${params.pricingModel || 'Freemium / Subscription / Commission'}"

Provide:
1. Value Proposition Canvas (Customer pain vs Pain relievers)
2. Primary Revenue Stream (Subscription, Commission, Freemium, One-time fee, Marketplace take rate)
3. Secondary / Future Monetization Streams
4. Unit Economics Estimation:
   - Estimated Customer Acquisition Cost (CAC)
   - Estimated Customer Lifetime Value (LTV)
   - Healthy LTV:CAC Ratio expectation
5. Recommended Pricing Tiers (e.g. Free Tier, Student Pro, Business/Enterprise) with reasoning.
`;
        break;

      case 'pitch_deck':
        toolPrompt = `
Generate a concise, 10-slide investor and college competition pitch deck outline for:
- Startup Name: "${params.startupName || params.name || params.businessName || 'EduSprint AI'}"
- Value Proposition: "${params.tagline || params.valueProp || 'Empowering students to achieve more'}"
- Core Problem & Solution: "${params.problemAndSolution || params.idea || params.problem || 'Solving key student productivity and academic bottlenecks'}"
- Target Market: "${params.market || params.targetMarket || params.targetAudience || 'College students and educational institutions'}"

Detail each of the 10 slides:
Slide 1: Title & Hook
Slide 2: The Problem (Realistic pain with emotional resonance)
Slide 3: The Solution (Your product's unfair advantage)
Slide 4: Market Opportunity (TAM, SAM, SOM with reasonable realistic boundaries)
Slide 5: Product & Tech Architecture (Highlight engineering innovation)
Slide 6: Business & Revenue Model (How you make money)
Slide 7: Traction & Milestones (Pilot tests, student waitlist, early users)
Slide 8: Competitive Landscape & Defensibility (Why you win)
Slide 9: Team & Roles (Engineering, Design, Operations)
Slide 10: The Ask & Milestones (Funding or mentorship request and exactly how it will be spent over 6 months).
`;
        break;

      case 'action_plan_7day':
        toolPrompt = `
Generate a rigorous, hyper-practical 7-Day Startup Sprint Action Plan for a college student team:
- Startup Idea: "${params.idea || params.startupIdea || params.concept || 'Campus Tech Startup'}"
- Available Time: "${params.hoursPerDay || '3 hours/day after college classes'}"
- Team Members: "${params.team || 'Solo founder or 2-3 engineering classmates'}"

Break down day-by-day with actionable morning/evening tasks:
- Day 1 (Problem Clarification & Anti-Assumptions)
- Day 2 (10 Guerilla Customer Interviews)
- Day 3 (No-Code MVP / Figma Clickable Prototype Scope)
- Day 4 (Build Landing Page + Waitlist Form)
- Day 5 (Beta Testing with 5 Friends/Peers & Usability Check)
- Day 6 (Incorporate Critical Feedback & Fix Friction)
- Day 7 (Soft Launch to College Community & Acquire First 10 Users)
Include a "Daily Checklist" and "Common Pitfall to Avoid".
`;
        break;

      default:
        return res.status(400).json({ error: `Unknown toolType: ${toolType}` });
    }

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let resultText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: toolPrompt,
          config: {
            systemInstruction: getSystemInstruction(
              language,
              `Focused Tool Generator: ${toolType}`
            ),
            temperature: 0.7,
          },
        });
        resultText = response.text || '';
        if (resultText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} generateContent failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!resultText && lastError) {
      throw lastError;
    }

    res.json({ result: resultText, toolType, language });
  } catch (error: any) {
    console.error('Error in /api/tools/generate:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate entrepreneurship tool output.',
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = isProduction ? (Number(process.env.PORT) || 3000) : 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Entrepreneurship AI Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
