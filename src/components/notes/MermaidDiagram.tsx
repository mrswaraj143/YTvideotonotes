"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({ code }: { code: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          look: "handDrawn",
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "Architects Daughter, Patrick Hand, cursive",
        });
        const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, code);
        if (cancelled || !host) return;
        host.innerHTML = svg;
        const svgEl = host.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.removeAttribute("height");
          svgEl.style.maxWidth = "100%";
        }
        setError(null);
      } catch {
        if (!cancelled) setError("Diagram could not be sketched — mermaid syntax was messy.");
      }
    })();

    return () => {
      cancelled = true;
      if (host) host.innerHTML = "";
    };
  }, [code, reactId]);

  if (error) {
    return <p className="font-hand text-sm italic text-rose-600">{error}</p>;
  }

  return <div ref={hostRef} className="mermaid-host w-full overflow-x-auto py-2" />;
}
