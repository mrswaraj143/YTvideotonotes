import { GoogleGenAI, Type } from "@google/genai";
import type { NotesDocument } from "@/lib/types";

const notesSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    contentsTable: { type: Type.ARRAY, items: { type: Type.STRING } },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectionTitle: { type: Type.STRING },
          summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyConceptBox: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
          diagram: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              code: { type: Type.STRING },
            },
            required: ["type", "code"],
          },
          comparisonTable: {
            type: Type.OBJECT,
            properties: {
              headers: { type: Type.ARRAY, items: { type: Type.STRING } },
              rows: {
                type: Type.ARRAY,
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            required: ["headers", "rows"],
          },
          codeBlock: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              commands: { type: Type.STRING },
            },
            required: ["language", "commands"],
          },
        },
        required: ["sectionTitle", "summaryPoints"],
      },
    },
    cheatSheetRecap: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "subtitle", "contentsTable", "sections", "cheatSheetRecap"],
};

function buildPrompt(transcriptChunk: string, videoTitle?: string, partInfo?: string) {
  return `You are an expert technical educator and mentor. Your goal is to transform the following video transcript into highly accessible, humanized, handwritten study notes for a student/developer learning new technologies.

${videoTitle ? `Video title: ${videoTitle}\n` : ""}
${partInfo ? `NOTE: This is ${partInfo} of a very long video. Focus strictly on the concepts in this specific chunk.\n` : ""}
Requirements:
- TONE: Write in a conversational, easy-to-understand, humanized tone. Explain complex jargon simply, as if you are mentoring a junior developer.
- CONTENT: Stick STRICTLY to the exact examples, analogies, and concepts mentioned in the YouTube video. Do not invent completely different examples. You can add brief expert context to clarify things, but the core content must map directly to the video.
- EXHAUSTIVE: Document everything. Capture EVERY concept and example mentioned in the video. Create AS MANY SECTIONS AS NECESSARY. Do not arbitrarily limit the length.
- summaryPoints: detailed but punchy bullets. Explain the "why" and "how" clearly and simply.
- Include a keyConceptBox when there is a core definition, warning, or "the real problem". Explain it simply.
- Include a mermaid diagram in at least 2 sections. Use valid mermaid (graph TD / flowchart LR / sequenceDiagram). Prefer simple mental models or architecture pipelines based on the video.
- diagram.type must be "mermaid".
- Include a comparisonTable when two terms/approaches are contrasted in the video.
- Include a codeBlock for real CLI/code. Use the exact code shown or implied in the video.
- tags: 3-6 short topic pills.
- cheatSheetRecap: 5-8 one-liners summarizing the most critical takeaways in plain English.

TRANSCRIPT:
"""
${transcriptChunk}
"""`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export function normalizeNotes(raw: unknown): NotesDocument {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sectionsIn = Array.isArray(data.sections) ? data.sections : [];

  return {
    title: asString(data.title, "Untitled Notes"),
    subtitle: asString(data.subtitle, "A distilled one-shot summary"),
    tags: asStringArray(data.tags),
    contentsTable: asStringArray(data.contentsTable),
    sections: sectionsIn.map((section) => {
      const s = (section && typeof section === "object" ? section : {}) as Record<string, unknown>;
      const box = s.keyConceptBox as Record<string, unknown> | null | undefined;
      const diagram = s.diagram as Record<string, unknown> | null | undefined;
      const table = s.comparisonTable as Record<string, unknown> | null | undefined;
      const code = s.codeBlock as Record<string, unknown> | null | undefined;

      return {
        sectionTitle: asString(s.sectionTitle, "Section"),
        summaryPoints: asStringArray(s.summaryPoints),
        keyConceptBox:
          box && asString(box.title)
            ? { title: asString(box.title), description: asString(box.description) }
            : null,
        diagram:
          diagram && asString(diagram.code)
            ? {
                type: asString(diagram.type, "mermaid") === "svg" ? "svg" : "mermaid",
                code: asString(diagram.code),
              }
            : null,
        comparisonTable:
          table && Array.isArray(table.headers)
            ? {
                headers: asStringArray(table.headers),
                rows: Array.isArray(table.rows)
                  ? table.rows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : []))
                  : [],
              }
            : null,
        codeBlock:
          code && asString(code.commands)
            ? { language: asString(code.language, "bash"), commands: asString(code.commands) }
            : null,
      };
    }),
    cheatSheetRecap: asStringArray(data.cheatSheetRecap),
  };
}

export async function generateNotesFromTranscript(
  transcript: string,
  videoTitle?: string,
): Promise<NotesDocument> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to .env.local.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Cap transcript to a single chunk that fits within Vercel Hobby's 60s timeout.
  // 14,000 chars ≈ a 20-minute video transcript. Gemini processes this in ~15-25s.
  const MAX_CHARS = 14000;
  const capped = transcript.length > MAX_CHARS
    ? transcript.slice(0, transcript.lastIndexOf(" ", MAX_CHARS)).trim()
    : transcript.trim();

  let response: any;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: buildPrompt(capped, videoTitle),
      config: {
        responseMimeType: "application/json",
        responseSchema: notesSchema,
        temperature: 0.4,
      },
    });
  } catch (err: any) {
    throw new Error(`Gemini API error: ${err.message ?? "Unknown error"}`);
  }

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON. Please try again.");
  }

  const notes = normalizeNotes(parsed);
  notes.contentsTable = notes.sections.map((s) => s.sectionTitle);

  if (!notes.sections.length) {
    throw new Error("Gemini did not produce any note sections. Please try again.");
  }

  return notes;
}
