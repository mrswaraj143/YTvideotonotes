import { NextResponse } from "next/server";
import { generateNotesFromTranscript } from "@/lib/gemini";

export const maxDuration = 60; // Max for Vercel Hobby plan. Upgrade to Pro for 300s.

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: string;
      videoTitle?: string;
    };

    const transcript = body.transcript?.trim();
    if (!transcript || transcript.length < 40) {
      return NextResponse.json(
        { error: "Transcript is too short. Paste more content or fetch captions first." },
        { status: 400 },
      );
    }

    const notes = await generateNotesFromTranscript(transcript, body.videoTitle);
    return NextResponse.json({ notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notes generation failed.";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
