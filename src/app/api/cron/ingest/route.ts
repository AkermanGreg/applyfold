import { isAuthorizedCron } from "@/lib/cron";
import { ingestBoards, ingestGlobalFeeds } from "@/lib/jobs/ingest";

// Hobby allows 300s per function; boards rotate oldest-first, so a run that stops early
// simply continues where it left off tomorrow.
export const maxDuration = 300;

/** Daily 05:00 UTC: refresh company boards, then the global feeds (Remote OK, HN, RSS). */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  const started = Date.now();
  const boards = await ingestBoards({ deadline: started + 230_000 });
  const feeds = await ingestGlobalFeeds({ deadline: started + 280_000 });
  return Response.json({
    boards: { fetched: boards.length, jobs: boards.reduce((sum, b) => sum + b.jobs, 0), errors: boards.filter((b) => b.error) },
    feeds,
    ms: Date.now() - started,
  });
}
