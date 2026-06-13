import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, currency: string = "INR"): string {
  if (currency === "INR") {
    const absVal = Math.abs(value);
    if (absVal >= 10000000) {
      return `${value < 0 ? "-" : ""}₹${(absVal / 10000000).toFixed(2)}Cr`;
    }
    if (absVal >= 100000) {
      return `${value < 0 ? "-" : ""}₹${(absVal / 100000).toFixed(2)}L`;
    }
    return `${value < 0 ? "-" : ""}₹${absVal.toLocaleString("en-IN")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getRiskColor(rating: number): string {
  if (rating <= 2) return "text-neon-green";
  if (rating <= 3) return "text-neon-amber";
  return "text-neon-red";
}

export function getPnlColor(pnl: number): string {
  if (pnl > 0) return "text-neon-green";
  if (pnl < 0) return "text-neon-red";
  return "text-text-secondary";
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return "#00ff88";
  if (score >= 60) return "#00d4ff";
  if (score >= 40) return "#ffaa00";
  return "#ff3366";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
