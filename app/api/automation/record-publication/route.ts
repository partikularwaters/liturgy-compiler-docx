import { supabase } from "@/lib/db/supabase";
import { authorizeAutomationRequest } from "@/lib/auth/automationAuth";

// n8n calls this right before sending a Liturgy's Saturday publication
// email. Must re-read this Liturgy's current status/ready_at at request
// time -- never trust a value n8n cached from an earlier poll, since a
// later edit can have returned it to Draft in between (the charter's own
// integration boundary: n8n never assumes readiness stays true between
// reads). The (liturgy_id, ready_at) unique constraint on
// liturgy_publications is the actual duplicate-delivery guard; a unique
// violation here means this exact revision was already recorded, so it's
// reported as "already delivered," not an error.
export async function POST(request: Request): Promise<Response> {
  if (!authorizeAutomationRequest(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const liturgyId = (body as { liturgyId?: unknown } | null)?.liturgyId;
    const readyAt = (body as { readyAt?: unknown } | null)?.readyAt;
    if (typeof liturgyId !== "string" || typeof readyAt !== "string") {
      return Response.json({ error: "liturgyId and readyAt are required strings." }, { status: 400 });
    }

    const { data: liturgy, error: readError } = await supabase
      .from("liturgies")
      .select("status, ready_at")
      .eq("id", liturgyId)
      .single();

    if (readError || !liturgy) {
      console.error("[app/api/automation/record-publication]", readError?.message);
      return Response.json({ error: "Unable to verify this liturgy's current status right now." }, { status: 502 });
    }

    // Compare parsed instants, not raw strings -- Postgres/PostgREST can
    // round-trip the identical timestamptz value in a different string
    // representation (e.g. "+00:00" vs n8n's own cached "Z"-suffixed ISO
    // string) than whatever exact text produced it, so a strict string
    // comparison would reject a genuinely still-current ready_at. A missing
    // or unparseable value on either side is never treated as a match.
    const currentReadyAtMs = liturgy.ready_at ? Date.parse(liturgy.ready_at) : NaN;
    const requestedReadyAtMs = Date.parse(readyAt);
    const sameRevision =
      !Number.isNaN(currentReadyAtMs) && !Number.isNaN(requestedReadyAtMs) && currentReadyAtMs === requestedReadyAtMs;

    if (liturgy.status !== "ready" || !sameRevision) {
      return Response.json({ delivered: false, reason: "no_longer_ready" }, { status: 409 });
    }

    // Store the server's own current ready_at value, not the client-supplied
    // one -- they refer to the same instant (just confirmed above), but this
    // keeps every row in liturgy_publications in Postgres's own canonical
    // format rather than whatever string shape a caller happened to send.
    const { error: insertError } = await supabase
      .from("liturgy_publications")
      .insert({ liturgy_id: liturgyId, ready_at: liturgy.ready_at });

    if (insertError) {
      // Postgres unique_violation on (liturgy_id, ready_at) -- this exact
      // revision was already recorded as delivered by an earlier call
      // (n8n's own retry, or a second poll that raced this one).
      if (insertError.code === "23505") {
        return Response.json({ delivered: false, reason: "already_delivered" });
      }
      console.error("[app/api/automation/record-publication]", insertError.message);
      return Response.json({ error: "Unable to record this publication right now." }, { status: 502 });
    }

    return Response.json({ delivered: true });
  } catch (error) {
    console.error("[app/api/automation/record-publication]", error);
    return Response.json({ error: "Unable to record this publication right now." }, { status: 500 });
  }
}
