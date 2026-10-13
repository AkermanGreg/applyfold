import { cn } from "@/lib/utils";

export function scoreLabel(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Good fit";
  if (score >= 40) return "Partial fit";
  return "Stretch";
}

/** Circular fit score. Color steps with the score so strong matches pop in a long list. */
export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, score));
  const tone = value >= 80 ? "text-primary" : value >= 60 ? "text-[oklch(0.62_0.11_170)]" : "text-[oklch(0.7_0.12_75)]";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Fit score ${value} out of 100: ${scoreLabel(value)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn("stroke-current", tone)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
