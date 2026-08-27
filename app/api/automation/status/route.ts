import { supabase } from "@/lib/db/supabase";
import { authorizeAutomationRequest } from "@/lib/auth/automationAuth";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { computeProgress } from "@/lib/liturgy/readiness";
import { compileViewUrl, webViewUrl } from "@/lib/liturgy/automationUrls";

// n8n's Wed/Fri progress-capture and Saturday polling both call this for a
// given service date, reading the current server-authoritative status and
// completion progress for each Liturgy that date -- never inferred from raw
// Item counts on the n8n side.
export async function GET(request: Request): Promise<Response> {
  if (!authorizeAutomationRequest(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: "date must be a YYYY-MM-DD query parameter." }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from("liturgies")
      .select("id, status, ready_at")
      .eq("service_date", date);

    if (error) {
      console.error("[app/api/automation/status]", error.message);
      return Response.json({ error: "Unable to load this week's status right now." }, { status: 502 });
    }

    const liturgies = await Promise.all(
      (rows ?? []).map(async (row) => {
        const liturgy = await getLiturgy(row.id);
        if (!liturgy) return null;

        return {
          id: row.id,
          templateName: liturgy.templateName,
          lordsDayNumber: liturgy.lordsDayNumber,
          status: row.status as "draft" | "ready",
          // Handed back to record-publication verbatim -- n8n has no other
          // way to know which revision it's about to publish. Must be the
          // exact value this same read produced, not re-derived, since
          // record-publication's own re-read is what n8n's value is
          // ultimately checked against.
          readyAt: row.ready_at as string | null,
          progress: computeProgress(liturgy),
          compileViewUrl: compileViewUrl(row.id),
          webViewUrl: webViewUrl(row.id),
        };
      })
    );

    // A single failed read fails the whole response closed -- same
    // discipline as getFormulas/getPrayers/getSongs's null-on-failure
    // contract: a partial status response is worse than an explicit error,
    // since n8n has no way to tell "this Liturgy has no progress data" from
    // "this Liturgy's read genuinely failed."
    if (liturgies.some((liturgy) => liturgy === null)) {
      return Response.json({ error: "Unable to load this week's status right now." }, { status: 502 });
    }

    return Response.json({ liturgies });
  } catch (error) {
    console.error("[app/api/automation/status]", error);
    return Response.json({ error: "Unable to load this week's status right now." }, { status: 500 });
  }
}
