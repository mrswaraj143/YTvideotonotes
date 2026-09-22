"use client";

import { useEffect, useId, useRef } from "react";
import rough from "roughjs";

type Props = {
  children: React.ReactNode;
  color?: string;
  fill?: string;
  className?: string;
  roughness?: number;
};

export function RoughFrame({
  children,
  color = "#1e3a5f",
  fill = "transparent",
  className = "",
  roughness = 1.7,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reactId = useId();

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    const draw = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width < 4 || height < 4) return;
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.replaceChildren();
      const rc = rough.svg(svg);
      const node = rc.rectangle(5, 5, Math.max(8, width - 10), Math.max(8, height - 10), {
        roughness,
        bowing: 1.4,
        stroke: color,
        strokeWidth: 2.1,
        fill: fill === "transparent" ? undefined : fill,
        fillStyle: "solid",
        seed: Math.abs(
          reactId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 12),
        ),
      });
      svg.appendChild(node);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    draw();
    return () => observer.disconnect();
  }, [color, fill, roughness, reactId]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      />
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  );
}
