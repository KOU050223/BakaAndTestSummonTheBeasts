import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`theme-panel relative overflow-hidden border-2 border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] shadow-[var(--dashboard-shadow)] backdrop-blur-[var(--dashboard-blur)] ${className}`}
    >
      {children}
    </div>
  );
}
