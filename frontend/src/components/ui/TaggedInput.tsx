import type { InputHTMLAttributes } from "react";
import { LabelTag } from "./LabelTag";

type TaggedInputProps = InputHTMLAttributes<HTMLInputElement> & {
  tag: string;
  label: string;
};

export function TaggedInput({ tag, label, className = "", ...inputProps }: TaggedInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2.5 cursor-default">
        <LabelTag variant="required">{tag}</LabelTag>
        <span className="text-blue-300 text-sm font-semibold tracking-wide">{label}</span>
      </label>
      <input
        className={`w-full px-3.5 py-2.5 bg-white/5 border border-sky-400/40 rounded-sm text-sky-100 text-base outline-none transition-all duration-200 placeholder:text-slate-400/50 placeholder:text-sm focus:border-sky-400 focus:bg-sky-400/8 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.2),0_0_12px_rgba(56,189,248,0.2)] ${className}`}
        {...inputProps}
      />
    </div>
  );
}
