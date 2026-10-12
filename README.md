# AGSgpt

A responsive study app for Year 8-10 Mathematics, Science, and English, built with Next.js, React, and TypeScript. AGSgpt explains doubts in clear, detailed steps and guides students through their own reasoning instead of giving final answers. It includes a question-led home page, guided workspace, full chat with locally saved history, student dashboard, and subject exploration.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. AI chat requires a provider API key; AGSgpt does not return canned or simulated answers. Study sessions are stored in this browser only; sign-in and cross-device account storage are not configured.

## Configure an AI provider

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY` to a valid provider key, and keep that file private. Optionally set `AI_MODEL` and `AI_BASE_URL` for an OpenAI-compatible chat-completions endpoint. Restart the development server after changing environment variables. The key is read only by `app/api/tutor/route.ts` and is never sent to the browser. Until a key is configured, the app reports that AI setup is required and will not fabricate tutor responses.

The AGSgpt endpoint validates message shape, subject, and year group, applies a learning-oriented system prompt, and reports provider errors without exposing credentials. Before deploying to a public audience, add provider-appropriate rate limiting, abuse monitoring, a privacy policy, and age-appropriate data handling. Persistent accounts, database-backed history, and uploaded-question image processing are not enabled in this preview.

## Production check

```bash
npm run lint
npm run build
npm start
```