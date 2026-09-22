"use client";

import type { NotesDocument, NoteSection } from "@/lib/types";
import { CalloutBox, CodeSnippet, ComparisonTable, PageFooter } from "@/components/notes/NotePrimitives";
import { MermaidDiagram } from "@/components/notes/MermaidDiagram";
import { RoughFrame } from "@/components/notes/RoughFrame";

const ACCENTS = ["#4f46e5", "#0f766e", "#be123c", "#b45309"];

function PaperPage({
  children,
  pageRef,
}: {
  children: React.ReactNode;
  pageRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <article
      ref={pageRef}
      className="paper-page relative flex min-h-[1123px] w-full max-w-[794px] flex-col overflow-hidden rounded-[4px] px-10 py-9 shadow-[0_24px_50px_rgba(80,70,50,0.18)]"
    >
      <div className="pointer-events-none absolute inset-y-0 left-8 w-px bg-rose-300/70" />
      {children}
    </article>
  );
}

function CoverPage({
  notes,
  page,
  total,
  pageRef,
}: {
  notes: NotesDocument;
  page: number;
  total: number;
  pageRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <PaperPage pageRef={pageRef}>
      <p className="font-heading text-sm tracking-[0.25em] text-indigo-500 uppercase">
        handwritten one-shot
      </p>
      <h1 className="mt-3 font-heading text-[42px] leading-[1.15] text-slate-900">{notes.title}</h1>
      <p className="mt-2 max-w-[34rem] font-hand text-[20px] leading-8 text-slate-600">
        {notes.subtitle}
      </p>
      {notes.tags && notes.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {notes.tags.map((tag, i) => (
            <span
              key={tag}
              className="rounded-full border-2 border-dashed px-3 py-1 font-heading text-sm"
              style={{
                borderColor: ACCENTS[i % ACCENTS.length],
                color: ACCENTS[i % ACCENTS.length],
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <RoughFrame color="#312e81" className="mt-8" fill="#eef2ff">
        <p className="font-heading text-2xl text-indigo-900">What&apos;s inside</p>
        <ol className="mt-3 space-y-2 font-hand text-[18px] text-slate-800">
          {notes.contentsTable.map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="w-6 font-heading text-rose-500">{String(i + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </RoughFrame>

      <div className="mt-8 grid grid-cols-2 gap-4 font-hand text-[15px] text-slate-600">
        <p className="rotate-[-1deg] rounded-md bg-amber-100/80 px-3 py-2">
          Sketchy diagrams · mermaid, hand-drawn look
        </p>
        <p className="rotate-[1deg] rounded-md bg-emerald-100/80 px-3 py-2">
          Distilled from the transcript, not copied
        </p>
      </div>
      <PageFooter page={page} total={total} />
    </PaperPage>
  );
}

function SectionPage({
  section,
  page,
  total,
  accent,
  pageRef,
}: {
  section: NoteSection;
  page: number;
  total: number;
  accent: string;
  pageRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <PaperPage pageRef={pageRef}>
      <h2 className="font-heading text-[30px] leading-tight" style={{ color: accent }}>
        {section.sectionTitle}
      </h2>
      <div className="mt-1 h-1 w-24 rounded-full" style={{ background: accent }} />

      <ul className="mt-5 space-y-2.5">
        {section.summaryPoints.map((point) => (
          <li key={point} className="flex gap-3 font-hand text-[17px] leading-7 text-slate-800">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {section.keyConceptBox && (
        <CalloutBox
          title={section.keyConceptBox.title}
          description={section.keyConceptBox.description}
        />
      )}

      {section.diagram?.code && (
        <div className="my-3 rounded-lg bg-white/50 px-2 py-1">
          <p className="font-heading text-sm text-slate-500">sketched flow</p>
          <MermaidDiagram key={section.diagram.code} code={section.diagram.code} />
        </div>
      )}

      {section.comparisonTable && section.comparisonTable.headers.length > 0 && (
        <ComparisonTable
          headers={section.comparisonTable.headers}
          rows={section.comparisonTable.rows}
        />
      )}

      {section.codeBlock && (
        <CodeSnippet language={section.codeBlock.language} commands={section.codeBlock.commands} />
      )}

      <PageFooter page={page} total={total} />
    </PaperPage>
  );
}

function RecapPage({
  recap,
  page,
  total,
  pageRef,
}: {
  recap: string[];
  page: number;
  total: number;
  pageRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <PaperPage pageRef={pageRef}>
      <h2 className="font-heading text-[32px] text-emerald-700">Cheat-sheet recap</h2>
      <p className="font-hand text-lg text-slate-500">Tattoo these on your brain.</p>
      <ol className="mt-6 space-y-3">
        {recap.map((line, i) => (
          <li
            key={line}
            className="flex gap-3 rounded-lg bg-emerald-50/80 px-3 py-2 font-hand text-[18px] leading-7 text-slate-800"
          >
            <span className="font-heading text-emerald-600">{i + 1}.</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
      <PageFooter page={page} total={total} />
    </PaperPage>
  );
}

export function Notebook({
  notes,
  registerPage,
}: {
  notes: NotesDocument;
  registerPage?: (index: number, el: HTMLElement | null) => void;
}) {
  const total = notes.sections.length + 2;

  return (
    <div className="flex flex-col items-center gap-8 pb-8">
      <CoverPage
        notes={notes}
        page={1}
        total={total}
        pageRef={(el) => registerPage?.(0, el)}
      />
      {notes.sections.map((section, i) => (
        <SectionPage
          key={section.sectionTitle}
          section={section}
          page={i + 2}
          total={total}
          accent={ACCENTS[i % ACCENTS.length]}
          pageRef={(el) => registerPage?.(i + 1, el)}
        />
      ))}
      <RecapPage
        recap={notes.cheatSheetRecap}
        page={total}
        total={total}
        pageRef={(el) => registerPage?.(notes.sections.length + 1, el)}
      />
    </div>
  );
}
