"use client";

import { getConfidenceColor } from "@/lib/utils";

interface ProbabilityBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  height?: number;
  className?: string;
}

export function ProbabilityBar({
  value,
  label,
  showValue = true,
  height = 6,
  className,
}: ProbabilityBarProps) {
  const color = getConfidenceColor(value);

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium" style={{ color }}>
              {value}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-white/5"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
