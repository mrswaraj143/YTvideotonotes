export type TranscriptCue = {
  text: string;
  offset: number;
  duration: number;
};

export type TranscriptResult = {
  videoId: string | null;
  source: "youtube" | "manual";
  title?: string;
  language?: string;
  cues: TranscriptCue[];
  fullText: string;
};

export type KeyConceptBox = {
  title: string;
  description: string;
};

export type DiagramBlock = {
  type: "mermaid" | "svg";
  code: string;
};

export type ComparisonTable = {
  headers: string[];
  rows: string[][];
};

export type CodeBlock = {
  language: string;
  commands: string;
};

export type NoteSection = {
  sectionTitle: string;
  summaryPoints: string[];
  keyConceptBox?: KeyConceptBox | null;
  diagram?: DiagramBlock | null;
  comparisonTable?: ComparisonTable | null;
  codeBlock?: CodeBlock | null;
};

export type NotesDocument = {
  title: string;
  subtitle: string;
  tags?: string[];
  contentsTable: string[];
  sections: NoteSection[];
  cheatSheetRecap: string[];
};

export type GenerateNotesRequest = {
  transcript: string;
  videoTitle?: string;
  videoUrl?: string;
};
