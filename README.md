# 🎬 Afterframe

> A cinematic social platform for film discovery, tracking, and conversations.

**[🌐 View Live Demo](https://sites-project.afterframe.workers.dev)**

Afterframe is a cinema-inspired movie discovery web app that brings your film shelf to life. Browse the live TMDB catalog, chat with an AI Projectionist to find your next favorite film, and build your own private film clubs to share recommendations with friends.

---

## ✨ Features

- **Movie Discovery:** Full catalog search and genre browsing powered by TMDB.
- **Where to Watch:** See exactly which streaming services, rental, or theater options are available in your region (powered by JustWatch).
- **The Projectionist:** An AI-powered chatbot (using Google Gemini) that recommends films based on your mood, a scene, or a vibe.
- **Your Film Diary:** A Letterboxd-style grid to log your watched films, give star ratings, like, and write reviews.
- **Film Clubs:** Create or join private film clubs with an invite code. Share reviews and direct recommendations exclusively with club members.
- **Inbox:** Receive film recommendations from your club members directly into your personalized inbox.
- **Modern Authentication:** Secure email/password login powered by Supabase.

## 🛠️ Tech Stack

- **Frontend:** React 19, custom CSS for a cinematic dark-mode experience.
- **Framework:** Vinext (Vite-powered server-side rendering).
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth).
- **AI:** Google Gemini (`gemini-3.5-flash-lite`).
- **External APIs:** TMDB API (Catalog & Availability).
- **Deployment:** Cloudflare Workers.

---

## 🚀 Getting Started

To run Afterframe locally, follow these steps:

### 1. Installation

Clone the repository and install dependencies using Node.js (v22.13+):

```bash
git clone https://github.com/Geeteshwer/AfterDramw-Movie.git
cd AfterDramw-Movie
npm ci
```

### 2. Environment Variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

You will need:
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **TMDB:** `TMDB_READ_ACCESS_TOKEN`
- **Google Gemini:** `GEMINI_API_KEY`

*(Note: Never commit your `.env` file!)*

### 3. Database Setup

In your Supabase project's SQL Editor, execute the migration file located at:
`supabase/migrations/202609080001_afterframe.sql`

This single transaction sets up all necessary tables (`profiles`, `clubs`, `memberships`, `reviews`, `recommendations`), triggers, and Row Level Security (RLS) rules.

### 4. Authentication Setup

In your Supabase Dashboard:
1. Go to **Authentication → URL Configuration**.
2. Set your deployed Site URL.
3. Add `http://localhost:3000` to the **Redirect URLs**.
4. Enable Email confirmations if you want users to verify their accounts before signing in.

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

Open the URL printed in your terminal (usually `http://localhost:3000`) to start exploring!

---

## 🔒 Architecture & Security

- **Row Level Security (RLS):** All data is protected at the database level. Profiles and reviews are visible only to the owner and members of their shared clubs.
- **Recommendations:** Recommendations are strictly tied to a specific club and can only be seen by the recipient and sender.
- **API Routes:** TMDB and Gemini API keys are never exposed to the client. All external requests are proxied securely through server-side `/api` routes.

## 📜 Credits & Attribution

- Movie metadata and images are provided by [TMDB](https://www.themoviedb.org/).
- Streaming availability data is provided by [JustWatch](https://www.justwatch.com/).
- Poster images belong to their respective rights holders.
