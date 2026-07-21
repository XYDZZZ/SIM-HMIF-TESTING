import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const base =
    "w-full rounded-md py-2.5 font-display text-[13px] uppercase tracking-[0.1em] " +
    "transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-signal-500 text-ink-950 hover:bg-signal-400",
    ghost: "border border-ink-600 text-paper-100 hover:border-signal-500 hover:text-signal-400",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
