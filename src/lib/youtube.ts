const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0]?.slice(0, 11);
      return id && VIDEO_ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;

      const match = url.pathname.match(/\/(shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }

  return null;
}

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
  name?: { simpleText?: string };
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

function parseXmlTranscript(xml: string): { text: string; offset: number; duration: number }[] {
  const cues: { text: string; offset: number; duration: number }[] = [];
  const regex = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) {
    const start = Number(match[1]) * 1000;
    const duration = Number(match[2]) * 1000;
    const text = decodeHtml(match[3].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (text) cues.push({ text, offset: start, duration });
  }
  return cues;
}

function extractCaptionTracks(html: string): CaptionTrack[] {
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]) as CaptionTrack[];
  } catch {
    return [];
  }
}

function extractWatchTitle(html: string): string | undefined {
  const match = html.match(/<title>([^<]+)<\/title>/);
  if (!match) return undefined;
  return decodeHtml(match[1]).replace(/\s*-\s*YouTube\s*$/, "").trim();
}

async function fetchViaSupadata(videoId: string): Promise<{
  cues: { text: string; offset: number; duration: number }[];
  language?: string;
  title?: string;
} | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!res.ok) return null;

    const data = await res.json() as {
      content?: { text: string; offset: number; duration: number }[];
      lang?: string;
    };
    if (!data?.content?.length) return null;

    return {
      cues: data.content.map((item) => ({
        text: item.text.replace(/\s+/g, " ").trim(),
        offset: item.offset,
        duration: item.duration,
      })),
      language: data.lang ?? "en",
      title: undefined,
    };
  } catch {
    return null;
  }
}

async function fetchTimedText(videoId: string): Promise<{
  cues: { text: string; offset: number; duration: number }[];
  language?: string;
  title?: string;
} | null> {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!watchRes.ok) return null;
  const html = await watchRes.text();
  const title = extractWatchTitle(html);
  const tracks = extractCaptionTracks(html);
  if (!tracks.length) return null;

  const preferred =
    tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0];

  if (!preferred?.baseUrl) return null;

  const captionUrl = preferred.baseUrl.startsWith("http")
    ? preferred.baseUrl
    : `https://www.youtube.com${preferred.baseUrl}`;

  const captionRes = await fetch(captionUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!captionRes.ok) return null;
  const xml = await captionRes.text();
  const cues = parseXmlTranscript(xml);
  if (!cues.length) return null;
  return { cues, language: preferred.languageCode, title };
}

export async function fetchYoutubeTranscript(videoId: string) {
  // 1. Try Supadata API first — works reliably on Vercel (avoids YouTube IP blocking).
  const supadataResult = await fetchViaSupadata(videoId);
  if (supadataResult) return supadataResult;

  // 2. Try youtube-transcript package.
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items?.length) {
      return {
        cues: items.map((item) => ({
          text: item.text.replace(/\s+/g, " ").trim(),
          offset: item.offset,
          duration: item.duration,
        })),
        language: "auto",
        title: undefined as string | undefined,
      };
    }
  } catch {
    // Fall through to timedtext scrape.
  }

  // 3. Fallback: direct YouTube scrape (works locally, may be blocked on cloud IPs).
  return fetchTimedText(videoId);
}
