# YouTube → Handwritten Notes

Next.js app that pulls a YouTube transcript (or accepts pasted text), sends it to Gemini 2.5 Flash as structured JSON, and renders cream-paper handwritten study notes with sketchy Mermaid diagrams. Export the pages as PDF.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Usage

- Paste a YouTube URL and click **Get captions**, then **Generate notes**.
- If captions are disabled, switch to **Paste transcript**.
- **Load sample** previews the Docker one-shot layout without an API key.
- **Export PDF** rasterizes each A4 notebook page.

## Stack

Next.js App Router, Tailwind CSS (neomorphism), `@google/genai` (`gemini-2.5-flash`), `youtube-transcript` plus a timedtext fallback, Mermaid `handDrawn` look, Rough.js frames, html2canvas + jsPDF.
