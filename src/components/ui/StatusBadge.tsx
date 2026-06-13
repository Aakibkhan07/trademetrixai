"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "inactive" | "success" | "warning" | "danger" | "info" | "buy" | "sell";

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-neon-green/15 text-neon-green border-neon-green/30",
  inactive: "bg-white/5 text-text-muted border-white/10",
  success: "bg-neon-green/15 text-neon-green border-neon-green/30",
  warning: "bg-neon-amber/15 text-neon-amber border-neon-amber/30",
  danger: "bg-neon-red/15 text-neon-red border-neon-red/30",
  info: "bg-neon-blue/15 text-neon-blue border-neon-blue/30",
  buy: "bg-neon-green/15 text-neon-green border-neon-green/30",
  sell: "bg-neon-red/15 text-neon-red border-neon-red/30",
};

export function StatusBadge({ variant, children, pulse = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border",
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              variant === "active" || variant === "success" || variant === "buy"
                ? "bg-neon-green"
                : variant === "danger" || variant === "sell"
                ? "bg-neon-red"
                : variant === "warning"
                ? "bg-neon-amber"
                : "bg-neon-blue"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              variant === "active" || variant === "success" || variant === "buy"
                ? "bg-neon-green"
                : variant === "danger" || variant === "sell"
                ? "bg-neon-red"
                : variant === "warning"
                ? "bg-neon-amber"
                : "bg-neon-blue"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
