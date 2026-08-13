import { Groq } from "groq-sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Keyword dictionary for automatic category classification
export const CATEGORY_MAP = {
  "Software / IT": [
    "developer",
    "software",
    "frontend",
    "backend",
    "fullstack",
    "react",
    "node",
    "python",
    "java",
    "tech",
    "web",
    "ui/ux",
    "designer",
    "data",
    "devops",
    "cloud",
    "system",
    "network",
    "cybersecurity",
    "ai",
    "machine learning",
  ],
  "Video / Graphics": [
    "video",
    "editor",
    "editing",
    "graphic",
    "graphics",
    "motion",
    "animator",
    "animation",
    "photoshop",
    "premiere",
    "after effects",
    "illustrator",
    "videographer",
    "creative",
    "content creator",
    "thumbnail",
    "design",
    "designer",
    "ቪዲዮ",
    "ኤዲተር",
    "ግራፊክስ",
  ],
  "Finance & Accounting": [
    "accountant",
    "finance",
    "auditor",
    "banking",
    "tax",
    "payroll",
    "cashier",
    "አካውንታንት",
  ],
  "Sales & Marketing": [
    "marketing",
    "sales",
    "social media",
    "content",
    "manager",
    "business",
    "copywriter",
    "digital marketing",
    "promoter",
    "seo",
  ],
  Healthcare: [
    "nurse",
    "doctor",
    "health",
    "clinical",
    "pharmacy",
    "pharmacist",
    "lab",
    "medical",
  ],
  "General / Other": [],
};

const SYSTEM_PROMPT = `
You are an expert AI recruiter specialized in extracting job listings from Ethiopian Telegram channels.
The input text may be in English, Amharic, or both.

CRITICAL INSTRUCTION:
A single post may contain multiple job vacancies or weekly digests. 
You MUST parse and return an array of job objects under the key "jobs".

OUTPUT FORMAT (JSON ONLY):
{
  "jobs": [
    {
      "title": "Concise English job title (e.g. 'Senior Video Editor')",
      "company": "Company name or 'Not Specified'",
      "category": "MUST be exactly one of: ['Software / IT', 'Video / Graphics', 'Finance & Accounting', 'Sales & Marketing', 'Healthcare', 'General / Other']",
      "tags": ["array", "of", "up", "to", "5", "English", "keywords"],
      "contactEmail": "extracted email or null",
      "contactPhone": "extracted phone number or null"
    }
  ]
}

CATEGORIZATION RULES:
1. "Software / IT": Web/Mobile Developers, DevOps, ML/AI, Data Analysts, Cloud Engineers, System Admins, CyberSecurity, IT Support.
2. "Video / Graphics": Video Editors (ቪዲዮ ኤዲተር), Graphic Designers, Motion Graphic Artists, Animators, UI/UX Designers, Videographers, Content Creators.
3. "Finance & Accounting": Accountants, Auditors, Financial Analysts, Cashiers, Bankers.
4. "Sales & Marketing": Digital Marketers, Sales Representatives, Social Media Managers, Copywriters.
5. "Healthcare": Doctors, Nurses, Pharmacists, Lab Technicians.
6. "General / Other": Anything else that does not fit the above categories.

If the post is in Amharic, TRANSLATE title, company, category, and tags into English in the output.
`;

/**
 * Local regex fallback when all AI APIs fail.
 * Matches contact details AND auto-categorizes using keyword matching.
 */
export const parseRawJobText = (rawText) => {
  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = rawText.match(
    /(?:\+251|0)\s?\d{2}\s?\d{3}\s?\d{4}|\b09\d{8}\b/
  );

  const lowerText = rawText.toLowerCase();
  let assignedCategory = "General / Other";

  // Check raw text against CATEGORY_MAP keywords
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
      assignedCategory = category;
      break;
    }
  }

  // Extract a basic title from the first line or fallback to default
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const detectedTitle = lines.length > 0 && lines[0].length < 60 ? lines[0] : "Channel Vacancy";

  return {
    title: detectedTitle,
    company: "Not Specified",
    category: assignedCategory,
    tags: [assignedCategory.split(" ")[0], "Telegram"],
    contactEmail: emailMatch ? emailMatch[0] : null,
    contactPhone: phoneMatch ? phoneMatch[0] : null,
  };
};

/**
 * Fast Local Pre-Filter: Returns false for non-job messages, ads, or channel announcements.
 */
export const isLikelyJobPost = (text) => {
  if (!text || text.length < 40) return false;

  const jobKeywords = [
    // English keywords
    "job",
    "vacancy",
    "hiring",
    "position",
    "apply",
    "qualification",
    "salary",
    "deadline",
    "experience",
    "education",
    "requirements",
    "officer",
    // Amharic keywords
    "የስራ",
    "ማስታወቂያ",
    "ተወዳዳሪ",
    "የትምህርት",
    "ልምድ",
    "ደመወዝ",
    "ቅጥር",
    "ኦፊሰር",
    "አመልካቾች",
    "የምዝገባ",
  ];

  const lowerText = text.toLowerCase();
  return jobKeywords.some((kw) => lowerText.includes(kw));
};

/**
 * Multi-Tier AI Fallback Engine:
 * Tier 1: Groq (Llama 3.1 8B Instant)
 * Tier 2: NVIDIA NIM (Llama 3.3 70B via OpenAI SDK)
 * Tier 3: Cerebras (Gemma 4 31B)
 * Tier 4: Google Gemini (Gemini 2.0 Flash)
 * Tier 5: OpenRouter (Free Tier Gateway)
 * Tier 6: Local Regex Fallback
 */
export const parseJobWithMultiAIFallback = async (rawText) => {
  // ----------------------------------------------------
  // Tier 1: Groq
  // ----------------------------------------------------
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("groq ....");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.warn(
        "⚠️ [Tier 1] Groq limit hit. Triggering NVIDIA fallback...",
        err.message
      );
    }
  }

  // ----------------------------------------------------
  // Tier 2: NVIDIA NIM (using OpenAI SDK)
  // ----------------------------------------------------
  if (process.env.NVIDIA_API_KEY) {
    try {
      console.log("NVIDIA ....");
      const nvidia = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      const res = await nvidia.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.warn(
        "⚠️ [Tier 2] NVIDIA failed. Triggering Cerebras fallback...",
        err.message
      );
    }
  }

  // ----------------------------------------------------
  // Tier 3: Cerebras
  // ----------------------------------------------------
  if (process.env.CEREBRAS_API_KEY) {
    try {
      console.log("Cerebras ....");
      const cerebras = new OpenAI({
        apiKey: process.env.CEREBRAS_API_KEY,
        baseURL: "https://api.cerebras.ai/v1",
      });
      const res = await cerebras.chat.completions.create({
        model: "gemma-4-31b",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.warn(
        "⚠️ [Tier 3] Cerebras failed. Triggering Gemini fallback...",
        err.message
      );
    }
  }

  // ----------------------------------------------------
  // Tier 4: Google Gemini
  // ----------------------------------------------------
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Gemini ....");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent(
        `${SYSTEM_PROMPT}\n\nJob Text:\n${rawText}`
      );
      return JSON.parse(res.response.text());
    } catch (err) {
      console.warn(
        "⚠️ [Tier 4] Gemini failed. Triggering OpenRouter fallback...",
        err.message
      );
    }
  }

  // ----------------------------------------------------
  // Tier 5: OpenRouter
  // ----------------------------------------------------
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("OpenRouter ....");
      const openRouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "EthioJobFinder",
        },
      });
      const res = await openRouter.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.warn(
        "⚠️ [Tier 5] OpenRouter failed. Falling back to local Regex...",
        err.message
      );
    }
  }

  // ----------------------------------------------------
  // Tier 6: Local Regex Fallback
  // ----------------------------------------------------
  console.log("ℹ️ All AI APIs exhausted. Using local Regex parser.");
  return { jobs: [parseRawJobText(rawText)] };
};