import { authorizeAutomationRequest } from "@/lib/auth/automationAuth";
import { ensureWeek } from "@/lib/liturgy/ensureWeek";
import { compileViewUrl } from "@/lib/liturgy/automationUrls";

// n8n's Monday trigger calls this to idempotently ensure the upcoming
// Sunday's Morning and Vesper Liturgies exist. Never client-reachable by a
// browser -- authorized only by the automation credential, not a human
// session.
export async function POST(request: Request): Promise<Response> {
  if (!authorizeAutomationRequest(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const upcomingSunday = (body as { upcomingSunday?: unknown } | null)?.upcomingSunday;
    if (typeof upcomingSunday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(upcomingSunday)) {
      return Response.json({ error: "upcomingSunday must be a YYYY-MM-DD string." }, { status: 400 });
    }

    const result = await ensureWeek(upcomingSunday);
    if (!result) {
      return Response.json({ error: "Unable to ensure this week's liturgies right now." }, { status: 502 });
    }

    return Response.json({
      morningLiturgyId: result.morningLiturgyId,
      vesperLiturgyId: result.vesperLiturgyId,
      morningCreated: result.morningCreated,
      vesperCreated: result.vesperCreated,
      lordsDayNumber: result.lordsDayNumber,
      morningCompileViewUrl: compileViewUrl(result.morningLiturgyId),
      vesperCompileViewUrl: compileViewUrl(result.vesperLiturgyId),
    });
  } catch (error) {
    console.error("[app/api/automation/ensure-week]", error);
    return Response.json({ error: "Unable to ensure this week's liturgies right now." }, { status: 500 });
  }
}
