const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", CAD: "CA$", AUD: "A$" };

export function formatSalary(min: number | null, max: number | null, currency: string | null): string | null {
  if (!min && !max) return null;
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] ?? `${currency} `) : "";
  const short = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value));
  if (min && max && min !== max) return `${symbol}${short(min)}–${symbol}${short(max)}`;
  return `${symbol}${short((min ?? max)!)}`;
}

export function formatPosted(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

export const REMOTE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site", unknown: null } as const;

export function scoreTone(score: number) {
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}
