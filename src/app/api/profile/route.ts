import { AI_TIMEOUT_MS, extractProfileWithClaude, hasAnthropicKey } from "@/lib/ai/anthropic";
import { profileRequestSchema, type ApiResult, type ProfileData } from "@/lib/client/api";
import { isDemoRequest, profileFixture } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 30;

function json(body: ApiResult<ProfileData>, status = 200) {
  return Response.json(body, { status });
}

function fallback(reason: string) {
  // Log the reason only, never the transcript or the extracted profile.
  console.warn(`[profile] fallback: ${reason}`);
  return json({ ok: true, data: profileFixture(), fallback: true });
}

/** Today's date in Ontario, as YYYY-MM-DD, for resolving "last summer" and similar phrases. */
function todayInOntario(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}

export async function POST(req: Request) {
  if (isDemoRequest(req)) return json({ ok: true, data: profileFixture(), fallback: true });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Expected a JSON body" }, 400);
  }
  const parsed = profileRequestSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: "Expected { transcript, languageCode, locale }" }, 400);

  if (!hasAnthropicKey()) return fallback("no Anthropic key configured");

  const started = Date.now();
  try {
    const data = await extractProfileWithClaude({
      transcript: parsed.data.transcript,
      languageCode: parsed.data.languageCode,
      today: todayInOntario(),
    });
    console.info(`[profile] ok in ${Date.now() - started} ms (budget ${AI_TIMEOUT_MS} ms)`);
    return json({ ok: true, data });
  } catch (err) {
    return fallback(`${err instanceof Error ? err.name : "error"} after ${Date.now() - started} ms`);
  }
}
