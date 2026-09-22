"use client";

import { useMemo, useRef, useState } from "react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { Notebook } from "@/components/notes/Notebook";
import { exportNotesPdf } from "@/lib/export-pdf";
import { SAMPLE_NOTES } from "@/lib/sample-notes";
import type { NotesDocument, TranscriptCue, TranscriptResult } from "@/lib/types";
import { formatTimestamp } from "@/lib/format";

type Mode = "url" | "paste";

export function Workspace() {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [notes, setNotes] = useState<NotesDocument | null>(null);
  const [busy, setBusy] = useState<"idle" | "captions" | "notes" | "pdf">("idle");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Drop a YouTube URL or paste a transcript.");
  const pagesRef = useRef<(HTMLElement | null)[]>([]);

  const cuePreview = useMemo(() => transcript?.cues.slice(0, 80) ?? [], [transcript]);

  function registerPage(index: number, el: HTMLElement | null) {
    pagesRef.current[index] = el;
  }

  async function fetchCaptions() {
    setError(null);
    setBusy("captions");
    setStatus("Pulling captions off the watch page…");
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not fetch captions.");
      }
      setTranscript(data as TranscriptResult);
      setStatus(`Captured ${(data as TranscriptResult).cues.length} caption cues. Ready to ink the notes.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caption fetch failed.");
      setStatus("Captions unavailable — paste the transcript and keep going.");
    } finally {
      setBusy("idle");
    }
  }

  async function generate(fromSample = false) {
    setError(null);
    if (fromSample) {
      setNotes(SAMPLE_NOTES);
      setTranscript({
        videoId: "sample",
        source: "manual",
        title: "Docker One-Shot (sample)",
        cues: SAMPLE_NOTES.cheatSheetRecap.map((text, i) => ({
          text,
          offset: i * 4000,
          duration: 4000,
        })),
        fullText: SAMPLE_NOTES.cheatSheetRecap.join(" "),
      });
      setStatus("Loaded the sample Docker one-shot so you can inspect the paper.");
      return;
    }

    const fullText =
      mode === "paste"
        ? paste.trim()
        : transcript?.fullText || paste.trim();

    if (!fullText) {
      setError("Need a transcript first — fetch captions or paste text.");
      return;
    }

    setBusy("notes");
    setStatus("Gemini is sketching sections, diagrams, and the recap…");
    try {
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullText,
          videoTitle: transcript?.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setNotes(data.notes as NotesDocument);
      if (mode === "paste" && !transcript) {
        setTranscript({
          videoId: null,
          source: "manual",
          cues: [],
          fullText,
        });
      }
      setStatus("Notes are on the paper. Scroll the notebook or export a PDF.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setStatus("Generation stalled. Check GEMINI_API_KEY or try the sample notes.");
    } finally {
      setBusy("idle");
    }
  }

  async function downloadPdf() {
    const pages = pagesRef.current.filter((el): el is HTMLElement => Boolean(el));
    if (!pages.length || !notes) return;
    setBusy("pdf");
    setStatus("Rasterizing each notebook page…");
    try {
      await exportNotesPdf(pages, notes.title);
      setStatus("PDF saved.");
    } catch (err) {
      console.error(err);
      setError(`PDF Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
      <header className="neo-convex rounded-[28px] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-heading text-sm tracking-[0.28em] text-indigo-500 uppercase">
              pen &amp; terminal
            </p>
            <h1 className="font-heading text-4xl text-slate-800 md:text-5xl">
              YouTube → Handwritten Notes
            </h1>
            <p className="mt-1 max-w-xl font-sans text-sm leading-6 text-slate-500">
              Neomorphic shell. Cream paper. Gemini 2.5 Flash turns captions into one-shot study pages
              with sketchy diagrams and a cheat sheet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NeoButton onClick={() => generate(true)}>Load sample</NeoButton>
            <NeoButton variant="coral" onClick={downloadPdf} disabled={!notes || busy !== "idle"}>
              {busy === "pdf" ? "Exporting…" : "Export PDF"}
            </NeoButton>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {(["url", "paste"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                mode === item ? "neo-concave text-indigo-600" : "text-slate-500"
              }`}
            >
              {item === "url" ? "YouTube URL" : "Paste transcript"}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <NeoInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchCaptions();
              }}
            />
            <NeoButton onClick={() => void fetchCaptions()} disabled={busy !== "idle" || !url.trim()}>
              {busy === "captions" ? "Fetching…" : "Get captions"}
            </NeoButton>
            <NeoButton variant="accent" onClick={() => void generate()} disabled={busy !== "idle"}>
              {busy === "notes" ? "Inking…" : "Generate notes"}
            </NeoButton>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <NeoTextarea
              rows={5}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste a raw transcript, lecture notes, or any long-form explanation…"
            />
            <NeoButton variant="accent" onClick={() => void generate()} disabled={busy !== "idle"}>
              {busy === "notes" ? "Inking…" : "Generate notes from text"}
            </NeoButton>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">{status}</p>
        {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,380px)_1fr]">
        <aside className="neo-convex h-fit rounded-[28px] p-5">
          <h2 className="font-heading text-2xl text-slate-700">Raw transcript</h2>
          <p className="mb-3 text-xs uppercase tracking-widest text-slate-400">
            {transcript
              ? `${transcript.source} · ${transcript.cues.length || "unsegmented"} cues`
              : "waiting"}
          </p>
          <div className="neo-concave max-h-[70vh] overflow-y-auto rounded-2xl p-4">
            {transcript?.fullText ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {transcript.fullText}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Captions and timestamps will land here. If YouTube hides them, switch to paste mode.
              </p>
            )}
          </div>
        </aside>

        <section className="neo-concave min-h-[80vh] rounded-[32px] p-4 md:p-8">
          {busy === "notes" ? (
            <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
              <div className="h-16 w-16 animate-pulse rounded-full neo-convex" />
              <p className="font-heading text-2xl text-slate-600">Writing in the margins…</p>
              <p className="max-w-sm text-sm text-slate-400">
                Structured JSON from Gemini, then mermaid sketch mode on cream paper.
              </p>
            </div>
          ) : notes ? (
            <Notebook notes={notes} registerPage={registerPage} />
          ) : (
            <div className="flex h-[70vh] flex-col items-center justify-center text-center">
              <p className="font-heading text-3xl text-slate-500">Empty notebook</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Fetch captions, paste text, or load the sample Docker one-shot to see the handwritten
                layout.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
