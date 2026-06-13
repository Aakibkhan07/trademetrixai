"use client";

import { cn } from "@/lib/utils";

interface GlowingPulseProps {
  color?: "green" | "red" | "blue" | "amber";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorMap = {
  green: "bg-neon-green",
  red: "bg-neon-red",
  blue: "bg-neon-blue",
  amber: "bg-neon-amber",
};

const sizeMap = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function GlowingPulse({ color = "green", size = "sm", className }: GlowingPulseProps) {
  return (
    <span className={cn("relative flex", sizeMap[size], className)}>
      <span
        className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          colorMap[color]
        )}
      />
      <span
        className={cn(
          "relative inline-flex rounded-full h-full w-full",
          colorMap[color]
        )}
      />
    </span>
  );
}
