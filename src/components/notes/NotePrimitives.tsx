import { RoughFrame } from "@/components/notes/RoughFrame";

export function CalloutBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <RoughFrame color="#c2410c" fill="#fff7ed" className="my-3">
      <p className="font-heading text-lg text-orange-800">{title}</p>
      <p className="mt-1 font-hand text-[17px] leading-7 text-slate-700">{description}</p>
    </RoughFrame>
  );
}

export function CodeSnippet({ language, commands }: { language: string; commands: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl bg-[#1e293b] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          {language}
        </span>
        <span className="flex gap-1">
          <i className="h-2 w-2 rounded-full bg-rose-400" />
          <i className="h-2 w-2 rounded-full bg-amber-300" />
          <i className="h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      </div>
      <pre className="overflow-x-auto font-mono text-[12px] leading-6 text-slate-100">
        <code>{commands}</code>
      </pre>
    </div>
  );
}

export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  const tones = ["#e0e7ff", "#d1fae5", "#ffe4e6", "#fef3c7"];
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse font-hand text-[16px] text-slate-800">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={`${header}-${i}`}
                className="border-2 border-slate-800 px-3 py-2 text-left font-heading text-base"
                style={{ background: tones[i % tones.length] }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {headers.map((_, c) => (
                <td key={c} className="border-2 border-slate-700 px-3 py-2 align-top">
                  {row[c] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <div className="mt-auto flex items-end justify-between pt-6 font-heading text-slate-500">
      <span className="text-sm italic">made with the pen &amp; the terminal</span>
      <span className="text-base">- {page} / {total} -</span>
    </div>
  );
}
