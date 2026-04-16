# AI Resume Analyzer

Upload a resume PDF + paste a job description → get ATS score, keyword match, section feedback, and top improvements powered by Claude AI.

## Deploy to Vercel (5 mins)

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Framework: Vite — Vercel auto-detects it
4. Click Deploy — done

> Note: The app calls the Anthropic API directly from the browser.
> For production use, move the API call to a serverless function to protect your key.

## Local dev

```bash
npm install
npm run dev
```

## Stack
- React + Vite
- Anthropic Claude API (claude-sonnet-4)
- PDF parsing via Claude's document understanding
