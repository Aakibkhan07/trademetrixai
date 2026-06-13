"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "blue" | "green" | "red" | "purple" | "none";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = "none",
  padding = "md",
  onClick,
}: GlassCardProps) {
  const glowMap = {
    blue: "neon-blue-glow",
    green: "neon-green-glow",
    red: "neon-red-glow",
    purple: "",
    none: "",
  };

  const paddingMap = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card",
        hover && "glass-card-hover cursor-pointer",
        glowMap[glow],
        paddingMap[padding],
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
