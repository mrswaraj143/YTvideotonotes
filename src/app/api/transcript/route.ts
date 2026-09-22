import { NextResponse } from "next/server";
import { extractVideoId, fetchYoutubeTranscript } from "@/lib/youtube";

// Increase timeout for external API calls (Supadata, YouTube scraping).
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "Provide a YouTube URL or video ID." }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse a YouTube video ID from that input." },
        { status: 400 },
      );
    }

    const result = await fetchYoutubeTranscript(videoId);
    if (!result?.cues.length) {
      return NextResponse.json(
        {
          error:
            "No captions were found. The video may have captions disabled — paste the transcript instead.",
          videoId,
        },
        { status: 422 },
      );
    }

    const fullText = result.cues.map((cue) => cue.text).join(" ").replace(/\s+/g, " ").trim();

    return NextResponse.json({
      videoId,
      source: "youtube",
      title: result.title,
      language: result.language,
      cues: result.cues,
      fullText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcript extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
