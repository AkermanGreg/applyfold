/** Sites whose terms forbid automated access: we never fetch them, the user pastes the text. */
const BLOCKED_HOSTS = ["linkedin.com", "indeed.com", "glassdoor.com", "glassdoor.co.uk", "indeed.co.uk"];

export type ParsedJobLink =
  | { kind: "greenhouse"; token: string; id: string }
  | { kind: "lever"; slug: string; id: string }
  | { kind: "ashby"; slug: string; id: string }
  | { kind: "page"; url: string }
  | { kind: "blocked"; host: string }
  | { kind: "invalid" };

export function parseJobLink(input: string): ParsedJobLink {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { kind: "invalid" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "invalid" };
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const blocked = BLOCKED_HOSTS.find((blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`));
  if (blocked) return { kind: "blocked", host: blocked };

  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") {
    const jobsIndex = parts.indexOf("jobs");
    if (parts[0] && jobsIndex > 0 && parts[jobsIndex + 1]) return { kind: "greenhouse", token: parts[0], id: parts[jobsIndex + 1]! };
  }
  // Company career sites embedding Greenhouse pass the job id as ?gh_jid=.
  const ghJid = url.searchParams.get("gh_jid");
  if (ghJid && /^\d+$/.test(ghJid)) {
    const token = url.searchParams.get("for");
    if (token) return { kind: "greenhouse", token, id: ghJid };
  }
  if (host === "jobs.lever.co" && parts[0] && parts[1]) return { kind: "lever", slug: parts[0], id: parts[1] };
  if (host === "jobs.ashbyhq.com" && parts[0] && parts[1]) return { kind: "ashby", slug: parts[0], id: parts[1] };

  // Refuse private-network targets so a pasted link can't be used to probe internal services.
  if (host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) || host.endsWith(".internal") || host === "[::1]") {
    return { kind: "invalid" };
  }
  return { kind: "page", url: url.toString() };
}
