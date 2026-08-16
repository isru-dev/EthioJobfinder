# Ethio Job Explorer 💼

A real-time job discovery platform that monitors and categorizes vacancy postings from multiple Ethiopian Telegram job channels, delivering instant Telegram DM alerts to users based on their preferred job sectors — including IT, Finance, Healthcare, Sales, and more.

**Live site:**-> https://ethio-jobfinder.vercel.app

---

## The Problem

Job seekers in Ethiopia often have to manually check five or more different Telegram groups every day — IT jobs, finance jobs, freelance gigs, general vacancies — just to find postings relevant to them. It's repetitive, time-consuming, and easy to miss opportunities that get buried under dozens of unrelated posts.

## The Solution

Ethio Job Explorer watches those Telegram channels continuously, uses AI to parse and categorize each job post by sector, and:

- Displays everything in one clean, searchable web UI
- Sends users an instant Telegram DM the moment a job matching their selected categories is posted

No more checking multiple groups by hand — the job comes to you.

---

## Features

- 🔎 **Live-monitored Telegram channels** — tracks multiple Ethiopian job-posting channels in real time via the Telegram MTProto API
- 🤖 **AI-powered categorization** — automatically extracts job title, company, category, tags, and contact info from raw (often messy, bilingual) post text
- 🌍 **Amharic + English support** — parses and translates Amharic job posts into structured English data
- 🗂️ **Sector-based browsing** — Software/IT, Video/Graphics, Finance & Accounting, Sales & Marketing, Healthcare, and General/Other
- 🔔 **Instant Telegram DM alerts** — users pick their preferred categories and get notified the moment a matching job is posted
- 🔗 **Direct links back to the original post** — every listing links straight to the source message on Telegram
- 🛡️ **Multi-tier AI fallback** — cascades through several AI providers (with a local regex-based parser as a last resort) so parsing keeps working even if one API is down or rate-limited

---

## Tech Stack

**Frontend**
- React
- Tailwind CSS
- Deployed on Vercel

**Backend**
- Node.js / Express
- MongoDB (Mongoose)
- GramJS (Telegram MTProto client) for live channel monitoring
- `node-telegram-bot-api` for sending DM alerts
- Telegram Login Widget for user authentication

**AI Parsing (multi-tier fallback)**
1. Groq (Llama 3.1 8B Instant)
2. NVIDIA NIM (Llama 3.3 70B)
3. Cerebras (Gemma)
4. Google Gemini
5. OpenRouter
6. Local regex fallback (keyword-based categorization)

---

## How It Works

1. A GramJS client stays connected to a set of monitored Telegram job channels.
2. New messages are pre-filtered locally (keyword check) to skip non-job posts before spending an AI call on them.
3. Valid posts are sent through the AI parsing pipeline, which extracts structured job data and assigns a category.
4. Parsed jobs are saved to MongoDB, deduplicated by a content hash so the same post is never stored twice.
5. For live (non-backfill) posts, the backend queries subscribed users matching that category and sends each one a Telegram DM alert via the bot.
6. The frontend displays all jobs in a searchable, filterable feed, with users able to opt into DM alerts per category.

On first boot, the backend also runs a one-time backfill of the past 7 days of channel history so the feed isn't empty on day one — without triggering DM alerts for old posts.

---


### Backend Setup

```bash
cd Backend
npm install

# Generate your Telegram session string (one-time, interactive)
node src/services/telegramAuth.js
# Follow the prompts, then copy the printed session string into .env

npm run dev
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

---



- **Frontend** → [Vercel](https://vercel.com) (static/React hosting, free tier)
- **Backend** → [Render](https://render.com) (persistent Node process — required for the always-on Telegram listener)

