import type { ReactNode } from "react";

type LabelTagVariant = "info" | "required" | "error";

type LabelTagProps = {
  children: ReactNode;
  variant?: LabelTagVariant;
};

const variantClasses: Record<LabelTagVariant, string> = {
  info:     "bg-sky-400/15 border border-sky-400 text-sky-300",
  required: "bg-yellow-400/15 border border-yellow-400 text-yellow-300",
  error:    "bg-red-500/30 border border-red-500 text-red-300",
};

export function LabelTag({ children, variant = "info" }: LabelTagProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[0.7rem] font-bold tracking-wide whitespace-nowrap ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
