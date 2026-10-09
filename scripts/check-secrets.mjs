#!/usr/bin/env node
// Pre-commit guard: refuse to commit env files or anything that looks like a live credential.
// Secrets belong in Vercel env vars; locally they arrive via `vercel env pull`.
import { execFileSync } from "node:child_process";

const staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const blockedFile = /(^|\/)\.env(\.(?!example$)[^/]*)?$/;

const secretPatterns = [
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Clerk secret key", re: /sk_(live|test)_[A-Za-z0-9]{20,}/ },
  { name: "Stripe live key", re: /(sk|rk)_live_[A-Za-z0-9]{20,}/ },
  { name: "Postgres URL with password", re: /postgres(ql)?:\/\/[^:\s/]+:[^@\s]{8,}@/ },
  { name: "Vercel Blob token", re: /vercel_blob_rw_[A-Za-z0-9_]{20,}/ },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const problems = [];

for (const file of staged) {
  if (blockedFile.test(file)) {
    problems.push(`${file}: env files must not be committed`);
    continue;
  }
  let contents;
  try {
    contents = execFileSync("git", ["show", `:${file}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  } catch {
    continue; // binary or unreadable
  }
  for (const { name, re } of secretPatterns) {
    if (re.test(contents)) problems.push(`${file}: looks like it contains a ${name}`);
  }
}

if (problems.length > 0) {
  console.error("Commit blocked by scripts/check-secrets.mjs:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nMove the value into Vercel env vars. If this is a false positive, fix the pattern.");
  process.exit(1);
}
