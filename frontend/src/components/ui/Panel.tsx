import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`relative bg-[rgba(10,30,60,0.85)] border-2 border-sky-400 rounded-sm backdrop-blur-md overflow-hidden shadow-[0_0_0_1px_rgba(56,189,248,0.3),0_0_20px_rgba(56,189,248,0.4),0_0_60px_rgba(56,189,248,0.15),inset_0_0_40px_rgba(56,189,248,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
