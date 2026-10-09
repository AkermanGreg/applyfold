/** Liveness check for uptime monitors. Deliberately touches no external services. */
export function GET() {
  return Response.json({ ok: true });
}
