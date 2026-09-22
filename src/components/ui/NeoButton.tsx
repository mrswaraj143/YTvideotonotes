import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "convex" | "accent" | "coral" | "ghost";
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  convex:
    "text-slate-700 neo-convex neo-press hover:-translate-y-0.5",
  accent:
    "text-white bg-indigo-500 shadow-[6px_6px_14px_#a3b1c6,-4px_-4px_10px_#ffffff] hover:bg-indigo-400 neo-press",
  coral:
    "text-white bg-rose-500 shadow-[6px_6px_14px_#a3b1c6,-4px_-4px_10px_#ffffff] hover:bg-rose-400 neo-press",
  ghost:
    "text-slate-500 neo-concave",
};

export function NeoButton({ children, variant = "convex", className = "", disabled, ...props }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
