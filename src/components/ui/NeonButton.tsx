"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "blue" | "green" | "red" | "ghost" | "outline" | "purple";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  glow?: boolean;
}

export function NeonButton({
  children,
  variant = "blue",
  size = "md",
  fullWidth = false,
  glow = true,
  className,
  ...props
}: NeonButtonProps) {
  const variantStyles = {
    blue: "bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 hover:border-neon-blue/50",
    green: "bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/50",
    red: "bg-neon-red/10 text-neon-red border border-neon-red/30 hover:bg-neon-red/20 hover:border-neon-red/50",
    ghost: "bg-transparent text-text-secondary border border-transparent hover:bg-white/5 hover:text-text-primary",
    outline: "bg-transparent text-text-primary border border-glass-border hover:bg-white/5 hover:border-neon-blue/30",
    purple: "bg-neon-purple/10 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/20 hover:border-neon-purple/50",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  };

  const glowStyles = glow
    ? {
        blue: "hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]",
        green: "hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]",
        red: "hover:shadow-[0_0_20px_rgba(255,51,102,0.15)]",
        ghost: "",
        outline: "hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]",
        purple: "hover:shadow-[0_0_20px_rgba(187,134,252,0.15)]",
      }
    : { blue: "", green: "", red: "", ghost: "", outline: "", purple: "" };

  return (
    <button
      className={cn(
        "font-medium transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        glowStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
