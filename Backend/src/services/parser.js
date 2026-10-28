import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/* =====================================================================
 * HOW THIS FILE WORKS
 *
 *   post text
 *     -> parseByRules()   splits the post into jobs and reads every field
 *                         with patterns (no AI, no cost, instant)
 *     -> job "confident"? -> done
 *     -> not confident    -> ask AI with a SHORT text only (queued, with
 *                            timeout and per-provider cooldown)
 *     -> AI unavailable   -> keep the rule-based result
 *
 * The listener still imports: parseJobWithMultiAIFallback, isLikelyJobPost
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 1. CATEGORIES
 *    Latin keywords are matched as whole words (so "ai" can't match "email").
 *    Amharic keywords are matched as plain substrings.
 *    Keep this list the same as the categories in your User model / frontend.
 * ------------------------------------------------------------------- */
export const CATEGORY_MAP = {
  "Software / IT": [
    "developer", "software", "frontend", "backend", "fullstack", "full stack",
    "react", "node.js", "python", "java", "devops", "cloud", "network",
    "cybersecurity", "machine learning", "data analyst", "data scientist",
    "database", "programmer", "web", "ict", "information technology",
    "it officer", "it support", "it strategy", "digital innovation",
    "business analyst", "system administrator", "qa engineer",
  ],
  "Video / Graphics": [
    "video", "videographer", "graphic", "graphics", "motion", "animator",
    "animation", "photoshop", "premiere", "after effects", "illustrator",
    "content creator", "thumbnail", "ui/ux", "ቪዲዮ", "ኤዲተር", "ግራፊክስ",
  ],
  "Finance & Accounting": [
    "accountant", "accounting", "finance", "financial", "auditor", "audit",
    "banking", "bank", "tax", "payroll", "cashier", "treasury", "bookkeeper",
    "budget", "አካውንታንት", "ሒሳብ", "ሂሳብ", "ባንክ",
  ],
  "Sales & Marketing": [
    "marketing", "sales", "social media", "copywriter", "digital marketing",
    "promoter", "seo", "business development", "customer service",
    "relationship manager", "merchandiser", "ሽያጭ", "ማርኬቲንግ",
  ],
  Healthcare: [
    "nurse", "doctor", "physician", "health", "clinical", "pharmacy",
    "pharmacist", "druggist", "laboratory", "lab technician", "midwife",
    "medical", "ሐኪም", "ነርስ", "ፋርማሲስት", "ጤና",
  ],
  "Engineering & Construction": [
    "engineer", "engineering", "architect", "architecture", "civil",
    "electrical", "mechanical", "mechanic", "technician", "surveyor",
    "construction", "maintenance", "electrician", "plumber", "welder",
    "belt conveyor", "መሐንዲስ", "ሜካኒክ",
  ],
  "General / Other": [],
};

export const CATEGORIES = Object.keys(CATEGORY_MAP);

// hahujobs posts carry the sector as a hashtag (#finance) - it is more
// reliable than guessing from words.
const HASHTAG_CATEGORY = {
  finance: "Finance & Accounting", accounting: "Finance & Accounting", banking: "Finance & Accounting",
  it: "Software / IT", ict: "Software / IT", software: "Software / IT", technology: "Software / IT",
  marketing: "Sales & Marketing", sales: "Sales & Marketing",
  health: "Healthcare", healthcare: "Healthcare", medical: "Healthcare",
  engineering: "Engineering & Construction", construction: "Engineering & Construction",
  architecture: "Engineering & Construction",
  design: "Video / Graphics", graphics: "Video / Graphics", video: "Video / Graphics",
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isAmharic = (s) => /[\u1200-\u137F]/.test(s);

// Build one test function per keyword, once, when the file loads.
const makeTest = (kw) => {
  if (isAmharic(kw)) return (text) => text.includes(kw);
  // (?<![\p{L}\p{N}]) = "not preceded by a letter/number", same idea after the word
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(kw)}(?![\\p{L}\\p{N}])`, "iu");
  return (text) => re.test(text);
};

const MATCHERS = Object.entries(CATEGORY_MAP).map(([category, kws]) => ({
  category,
  tests: kws.map(makeTest),
}));

/**
 * Scores every category. A keyword in the TITLE is worth 3, in the body 1.
 * Ties go to the category listed first in CATEGORY_MAP.
 */
export const categorize = (title = "", body = "") => {
  let best = { category: "General / Other", score: 0 };
  for (const { category, tests } of MATCHERS) {
    let score = 0;
    for (const test of tests) {
      if (title && test(title)) score += 3;
      else if (test(body)) score += 1;
    }
    if (score > best.score) best = { category, score };
  }
  return best;
};

/* ---------------------------------------------------------------------
 * 2. SMALL READING HELPERS
 * ------------------------------------------------------------------- */

// Separator after a label: ":"  ":-"  "："  "፦"  "-"   (with optional spaces)
const SEP = String.raw`\s*(?:[:：፦]-?|-)\s*`;

// Reads the rest of the line after a label, e.g. field(text, "Deadline") -> "November 6,2026"
const field = (text, labels) =>
  text.match(new RegExp(`(?:${labels})${SEP}([^\\n]+)`, "iu"))?.[1]?.trim() || null;

// [ስሥ] accepts both spellings (የስራ / የሥራ)
const LABELS = {
  title: "Job Title|Position\\s*\\d+|የ[ስሥ]ራ መደቡ ስም|የ[ስሥ]ራ መደብ",
  company: "Company(?: Name)?|Employer|ድርጅት|የድርጅቱ ስም",
  deadline: "Closing Date|Deadline|የምዝገባ ጊዜ|ቀነ ገደብ",
  salary: "Salary(?:/Compensation)?|ደመወዝ|ደሞዝ",
  location: "(?:Work )?Location|የ[ስሥ]ራ ቦታ|አድራሻ",
};

// The channels' own handles appear in footers - they are NOT the employer's contact.
export const OWN_HANDLES = new Set([
  "@jobethaddis", "@effoyjobs", "@freelance_ethio", "@hahujobsforfreshgraduates",
  "@jobs_in_ethio", "@hahujobs", "@hahujobs_bot", "@freelanceethbot", "@afriworkamharic",
]);

const contacts = (text) => ({
  contactEmail: text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null,
  // remove spaces/dashes first so "+251 98 827 9440" still matches
  contactPhone: text.replace(/[\s-]/g, "").match(/(?:\+251|0)9\d{8}/)?.[0] ?? null,
  // (?<![\w.+-])@  = an @ that is NOT inside an email address
  contactTelegram:
    [...text.matchAll(/(?<![\w.+-])@[A-Za-z]\w{4,31}/g)]
      .map((m) => m[0])
      .find((h) => !OWN_HANDLES.has(h.toLowerCase())) ?? null,
  applyUrl:
    text.match(/https?:\/\/(?!t\.me)[^\s)>\]]+/)?.[0]?.replace(/[.,;:]+$/, "") ?? null,
});

/* ---------------------------------------------------------------------
 * 3. DATES  (English and Ethiopian calendar)
 * ------------------------------------------------------------------- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const parseEnglishDate = (s) => {
  // "November 6,2026"  "Oct 29th, 2026"  "Nov 4, 2026"
  let m = s.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})/);
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    return mi < 0 ? null : new Date(Date.UTC(+m[3], mi, +m[2]));
  }
  // "6 November 2026"
  m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (m) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    return mi < 0 ? null : new Date(Date.UTC(+m[3], mi, +m[1]));
  }
  return null;
};

const ETH_MONTHS = {
  "መስከረም": 1, "ጥቅምት": 2, "ህዳር": 3, "ኅዳር": 3, "ታህሳስ": 4, "ታኅሣሥ": 4, "ጥር": 5,
  "የካቲት": 6, "መጋቢት": 7, "ሚያዝያ": 8, "ግንቦት": 9, "ሰኔ": 10, "ሐምሌ": 11, "ነሐሴ": 12,
};

// Ethiopian year starts on Sept 11 (Sept 12 in the year after an Ethiopian leap year).
// Every month has 30 days. Valid for normal 2000s dates.
const ethToGreg = (y, m, d) => {
  const t = new Date(Date.UTC(y + 7, 8, y % 4 === 0 ? 12 : 11));
  t.setUTCDate(t.getUTCDate() + (m - 1) * 30 + (d - 1));
  return t;
};

export const parseDeadline = (s) => {
  if (!s) return null;
  if (isAmharic(s)) {
    // "ጥቅምት 17/2019 ዓ.ም እስከ ጥቅምት 27/2019 ዓ.ም" -> take the LAST date
    const eth = [...s.matchAll(/([\u1200-\u137F]+)\s*(\d{1,2})\s*\/\s*(\d{4})/g)].pop();
    if (eth && ETH_MONTHS[eth[1]]) return ethToGreg(+eth[3], ETH_MONTHS[eth[1]], +eth[2]);
  }
  return parseEnglishDate(s);
};

/* ---------------------------------------------------------------------
 * 4. COMPANY AND TITLE
 * ------------------------------------------------------------------- */

// Header lines look like "★ Company Job Vacancy" or "📌 የሥራ ማስታወቂያ - Company"
const isHeaderLine = (line) =>
  /^\s*[★📌📢🔔]/u.test(line) || /vacancy|የ[ስሥ]ራ ማስታወቂያ/iu.test(line);

const cleanHeader = (line) =>
  line
    .replace(/^[^\p{L}\p{N}\[]+/u, "")                          // leading emoji / symbols
    .replace(/^\[[^\]]*\]\s*/, "")                               // "[በ0 አመት]" tag
    .replace(/^የ[ስሥ]ራ ማስታወቂያ\s*[-–:፦]\s*/u, "")             // "የሥራ ማስታወቂያ - "
    .replace(/(?<=\S)\s+(?:Job\s+)?Vacancy\b.*$/iu, "")          // "... Job Vacancy"
    .replace(/(?<=\S)\s+(?:አዲስ\s+)?የ[ስሥ]ራ ማስታወቂያ.*$/u, "")  // "... አዲስ የስራ ማስታወቂያ"
    .trim();

const prettyTag = (tag) =>
  tag.split("_").filter(Boolean)
    .map((w) => (/^(plc|ltd|sc|llc)$/i.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

const guessCompany = (text, hashtags) => {
  const labelled = field(text, LABELS.company);
  if (labelled) return labelled;

  // afriworket: the line right before "Verified Company"
  const verified = text.match(/([^\n]+)\n\s*Verified Company/i)?.[1]?.trim();
  if (verified) return verified;

  // hahujobs: first hashtag is the company
  if (hashtags.length >= 2) return prettyTag(hashtags[0]);

  const first = text.split("\n")[0];
  if (isHeaderLine(first)) return cleanHeader(first) || null;
  return null;
};

const cleanTitle = (s) =>
  s ? s.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim() || null : null;

/* ---------------------------------------------------------------------
 * 5. SPLITTING A POST INTO JOBS
 *    "✅ Position 1: ..." / "✔ Position 2: ..." start a new job.
 * ------------------------------------------------------------------- */
const splitPositions = (text) => {
  const starts = [...text.matchAll(/^[^\p{L}\p{N}\n]*Position\s*\d+\s*[:：]/gimu)].map((m) => m.index);
  if (starts.length < 2) return [text];
  return starts.map((s, i) => text.slice(s, starts[i + 1] ?? text.length));
};

/* ---------------------------------------------------------------------
 * 6. RULE-BASED PARSER
 * ------------------------------------------------------------------- */
const CONFIDENT_MIN_SCORE = 3;
const MAX_CLEAN_TITLE = 60; // longer "titles" are usually a whole sentence -> let AI handle it

export const parseByRules = (text) => {
  // lines that are ONLY a hashtag:  #company / #sector / #city
  const hashtags = [...text.matchAll(/^#([A-Za-z0-9_]+)[ \t]*$/gm)].map((m) => m[1].toLowerCase());
  const sectorCategory = hashtags.length >= 2 ? HASHTAG_CATEGORY[hashtags[1]] : undefined;

  const shared = {
    company: guessCompany(text, hashtags),
    deadline: parseDeadline(field(text, LABELS.deadline)),
    ...contacts(text),
  };

  return splitPositions(text).map((block) => {
    const firstLine = block.split("\n")[0].trim();
    const title =
      cleanTitle(field(block, LABELS.title)) ??
      (isHeaderLine(firstLine) || firstLine.startsWith("#") ? null : cleanTitle(firstLine));

    const scored = categorize(title ?? "", block);
    const category = sectorCategory ?? scored.category;
    const confident = Boolean(
      title &&
        title.length <= MAX_CLEAN_TITLE &&
        (sectorCategory || scored.score >= CONFIDENT_MIN_SCORE)
    );

    return {
      title,
      company: shared.company,
      category,
      tags: [category.split(/[ /&]+/)[0], "Telegram"],
      contactEmail: shared.contactEmail,
      contactPhone: shared.contactPhone,
      contactTelegram: shared.contactTelegram,
      applyUrl: shared.applyUrl,
      deadline: parseDeadline(field(block, LABELS.deadline)) ?? shared.deadline,
      salary: field(block, LABELS.salary), // per job only: position 2 must not inherit position 1's salary
      location: field(block, LABELS.location),
      confident,
      block,
    };
  });
};

const toPublicJob = (job) => ({
  title: (job.title ?? "Channel Vacancy").slice(0, 80),
  company: job.company ?? "Not Specified",
  category: job.category,
  tags: job.tags,
  contactEmail: job.contactEmail,
  contactPhone: job.contactPhone,
  contactTelegram: job.contactTelegram,
  applyUrl: job.applyUrl,
  deadline: job.deadline,
  salary: job.salary,
  location: job.location,
});

// Kept for old imports
export const parseRawJobText = (rawText) => toPublicJob(parseByRules(rawText)[0]);

/* ---------------------------------------------------------------------
 * 7. FAST PRE-FILTER  (is this message a job post at all?)
 * ------------------------------------------------------------------- */
export const isLikelyJobPost = (text) => {
  if (!text || text.length < 40) return false;
  const jobKeywords = [
    "job", "vacancy", "hiring", "position", "apply", "qualification", "salary",
    "deadline", "closing date", "experience", "education", "requirements", "officer",
    "የስራ", "የሥራ", "ማስታወቂያ", "ተወዳዳሪ", "የትምህርት", "ልምድ", "ደመወዝ", "ደሞዝ", "ቅጥር",
    "ኦፊሰር", "አመልካቾች", "የምዝገባ",
  ];
  const lower = text.toLowerCase();
  return jobKeywords.some((kw) => lower.includes(kw));
};

/* ---------------------------------------------------------------------
 * 8. AI FALLBACK  (only for jobs the rules are not sure about)
 *    - short prompt, short input  -> few tokens
 *    - one call at a time + small gap -> no bursts
 *    - timeout, no hidden retries
 *    - a provider that fails is skipped for a while (cooldown)
 * ------------------------------------------------------------------- */
const AI_GAP_MS = Number(process.env.AI_GAP_MS ?? 400);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 15000);
const AI_INPUT_CHARS = 600;

const SHORT_PROMPT = `Extract ONE job from the text. Reply with JSON only:
{"title":"concise English job title","company":"company name or Not Specified","category":"one of: ${CATEGORIES.join(" | ")}","tags":["up to 5 English keywords"]}
If the text is Amharic, translate title, company and tags into English.`;

const openAICompat =
  ({ baseURL, apiKey, modelEnv, defaultModel, json = true, headers }) =>
  async (text) => {
    const client = new OpenAI({ apiKey, baseURL, maxRetries: 0, defaultHeaders: headers });
    const res = await client.chat.completions.create({
      model: process.env[modelEnv] || defaultModel,
      temperature: 0.1,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: SHORT_PROMPT },
        { role: "user", content: text },
      ],
    });
    return res.choices[0].message.content;
  };

const callGemini = async (text) => {
  const model = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: SHORT_PROMPT,
    generationConfig: { responseMimeType: "application/json" },
  });
  return (await model.generateContent(text)).response.text();
};
// Model names can be changed in .env (GROQ_MODEL=...) without touching code.
// Check these defaults against each provider's current model list.
const PROVIDERS = [
  { name: "groq", apiKey: GROQ_API_KEY,
    call: openAICompat({ baseURL: "https://api.groq.com/openai/v1", apiKey: GROQ_API_KEY,
      modelEnv: "GROQ_MODEL", defaultModel: "openai/gpt-oss-20b" }) },
  { name: "nvidia", apiKey: NVIDIA_API_KEY,
    call: openAICompat({ baseURL: "https://integrate.api.nvidia.com/v1", apiKey: NVIDIA_API_KEY,
      modelEnv: "NVIDIA_MODEL", defaultModel: "meta/llama-3.3-70b-instruct" }) },
  { name: "cerebras", apiKey: CEREBRAS_API_KEY,
    call: openAICompat({ baseURL: "https://api.cerebras.ai/v1", apiKey: CEREBRAS_API_KEY,
      modelEnv: "CEREBRAS_MODEL", defaultModel: "gemma-4-31b" }) },
  { name: "gemini", apiKey: GEMINI_API_KEY, call: callGemini },
  { name: "openrouter", apiKey: OPENROUTER_API_KEY,
    call: openAICompat({ baseURL: "https://openrouter.ai/api/v1", apiKey: OPENROUTER_API_KEY,
      modelEnv: "OPENROUTER_MODEL", defaultModel: "liquid/lfm-2.5-2.6b:free",
      json: false, headers: { "HTTP-Referer": "http://localhost:5000", "X-Title": "EthioJobFinder" } }) },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withTimeout = (promise, ms) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("AI timeout")), ms); }),
  ]).finally(() => clearTimeout(timer));
};

// One AI call at a time, with a small pause after each.
let queue = Promise.resolve();
const enqueue = (task) => {
  const run = queue.then(task);
  queue = run.catch(() => {}).then(() => sleep(AI_GAP_MS));
  return run;
};

const cooldownUntil = {};

// Works even if the model wraps the JSON in ```json fences or adds text around it.
const extractJson = (s) => {
  const m = typeof s === "string" ? s.match(/\{[\s\S]*\}/) : null;
  return m ? JSON.parse(m[0]) : null;
};

const validateAI = (o) => {
  if (!o || typeof o.title !== "string" || !o.title.trim()) return null;
  const company = typeof o.company === "string" ? o.company.trim() : "";
  return {
    title: o.title.trim().slice(0, 80),
    company: company && !/not specified/i.test(company) ? company : null,
    category: CATEGORIES.includes(o.category) ? o.category : null,
    tags: Array.isArray(o.tags) ? o.tags.filter((t) => typeof t === "string").slice(0, 5) : [],
  };
};

const askAI = (text) =>
  enqueue(async () => {
    for (const p of PROVIDERS) {
      if (!p.apiKey || Date.now() < (cooldownUntil[p.name] ?? 0)) continue;
      try {
        const raw = await withTimeout(p.call(text), AI_TIMEOUT_MS);
        const parsed = validateAI(extractJson(raw));
        if (parsed) return parsed;
        console.warn(`⚠️ [${p.name}] returned unusable JSON, trying next provider`);
      } catch (err) {
        cooldownUntil[p.name] = Date.now() + (err?.status === 429 ? 60_000 : 15_000);
        console.warn(
          `⚠️ [${p.name}] failed (${err?.status ?? "unknown"}): ${err?.error?.message ?? err?.message ?? "No error details"}; skipping it for a while`
        );
      }
    }
    return null;
  });

export const stats = { rules: 0, ai: 0, aiFailed: 0 };

const enhanceWithAI = async (job) => {
  const ai = await askAI(job.block.slice(0, AI_INPUT_CHARS));
  if (!ai) { stats.aiFailed++; return job; }
  stats.ai++;
  return {
    ...job,
    title: ai.title,
    company: ai.company ?? job.company,
    category: ai.category ?? job.category,
    tags: ai.tags.length ? ai.tags : job.tags,
  };
};

/* ---------------------------------------------------------------------
 * 9. MAIN ENTRY  (same name and return shape the listener already uses)
 *    parseJobWithMultiAIFallback(text)                    -> rules + AI when needed
 *    parseJobWithMultiAIFallback(text, { useAI: false })  -> rules only (use for backfill)
 * ------------------------------------------------------------------- */
export const parseJobWithMultiAIFallback = async (rawText, { useAI = true } = {}) => {
  const jobs = [];
  for (const job of parseByRules(rawText)) {
    if (job.confident || !useAI) {
      stats.rules++;
      jobs.push(toPublicJob(job));
    } else {
      jobs.push(toPublicJob(await enhanceWithAI(job)));
    }
  }
  return { jobs };
};