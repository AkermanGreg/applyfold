import { cn } from "@/lib/utils";

/** Muted tints that sit well next to the brand teal; picked deterministically per company. */
const TINTS = [
  "bg-[oklch(0.94_0.04_180)] text-[oklch(0.35_0.07_180)]",
  "bg-[oklch(0.94_0.05_80)] text-[oklch(0.4_0.08_60)]",
  "bg-[oklch(0.94_0.04_260)] text-[oklch(0.38_0.08_260)]",
  "bg-[oklch(0.94_0.05_20)] text-[oklch(0.42_0.1_25)]",
  "bg-[oklch(0.94_0.04_140)] text-[oklch(0.38_0.07_145)]",
  "bg-[oklch(0.94_0.04_320)] text-[oklch(0.4_0.08_320)]",
];

function hash(text: string) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

export function companyInitials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words.length === 1 ? words[0]!.slice(0, 2) : `${words[0]![0]}${words[1]![0]}`).toUpperCase();
}

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-semibold",
        TINTS[hash(name) % TINTS.length],
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-11 text-sm",
        size === "lg" && "size-14 text-base",
      )}
    >
      {companyInitials(name)}
    </span>
  );
}
