"use client";

import { getConfidenceColor } from "@/lib/utils";

interface ConfidenceMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceMeter({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  className,
}: ConfidenceMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - score) / 100) * circumference;
  const color = getConfidenceColor(score);

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ""}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          className="confidence-ring"
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-[9px] text-text-muted uppercase tracking-wider">Score</span>
        </div>
      )}
    </div>
  );
}
