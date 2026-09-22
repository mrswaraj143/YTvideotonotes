import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function NeoInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border-0 bg-[#e0e5ec] px-5 py-4 text-slate-700 outline-none placeholder:text-slate-400 neo-concave ${className}`}
      {...props}
    />
  );
}

export function NeoTextarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-none rounded-2xl border-0 bg-[#e0e5ec] px-4 py-3 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 neo-concave ${className}`}
      {...props}
    />
  );
}
