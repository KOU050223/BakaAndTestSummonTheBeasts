import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-br from-sky-500 to-indigo-500 shadow-[0_0_20px_rgba(56,189,248,0.5),0_4px_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),0_6px_20px_rgba(99,102,241,0.6)]",
  danger:  "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.4),0_4px_15px_rgba(185,28,28,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6),0_6px_20px_rgba(185,28,28,0.5)]",
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`relative overflow-hidden px-5 py-3.5 rounded-sm text-white text-base font-black tracking-widest [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
