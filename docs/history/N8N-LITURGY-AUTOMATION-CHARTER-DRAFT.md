# n8n Liturgy Automation — Charter Working Draft

**Status:** Incomplete charter consolidation for handoff. This is not an approved Implementation Plan and authorizes no implementation.

**Created:** 2026-08-27

## Objective

Build a genuine weekly liturgy workflow that creates and monitors the upcoming Sunday’s Morning and Vesper Liturgies, reminds the people compiling them, and independently publishes each Liturgy when it is explicitly ready. The workflow should also create enough real application/database activity to make Supabase Free pausing less likely, while staying within the project’s existing free-platform constraints.

Supabase currently evaluates Free projects for low activity over a seven-day window. Its documentation says a few user database requests per day are typically sufficient to prevent pausing, but only a paid plan guarantees that a project will not be paused.

## Agreed language

- **Upcoming Sunday:** The next calendar Sunday in `Asia/Manila`. Monday’s automation ensures exactly one Morning and one Vesper Liturgy exist for that date.
- **Empty Liturgy:** A Liturgy with no meaningful compiler-authored content. Automatically seeded Morning Verbal Cues and automatically assigned Vesper readings do not by themselves mean that human compilation has begun.
- **Ready for publication:** An explicit workflow state set by a trusted Compiler after the application’s required-Section validation passes. This replaces the earlier working phrases “Complete Liturgy” and “Ready for Prod.”
- **Capture data:** A concise status report containing the service date, Template, progress/readiness state, completed and missing required Sections, and a Compile View link for continuing work. It does not copy all liturgical text into the notification.
- **Digital Liturgy:** The public, nav-free Liturgy Web View URL. Whether the Saturday message should also attach or link the Congregation Bulletin DOCX remains open.

## Confirmed decisions

### Weekly workflow

- Monday idempotently creates or reuses the upcoming Sunday’s Morning and Vesper Liturgies.
- Creation sends an email containing the relevant Compile View links.
- Wednesday sends a progress capture and continuation links.
- Friday sends a follow-up progress capture and continuation links.
- Saturday checks publication readiness and sends each ready Liturgy to the publication recipients.
- Morning and Vesper publish independently. One must not wait for the other.
- Retries must never create duplicate Liturgies or send the same publication revision twice.

### Readiness and progress

- Every new Liturgy begins in **Draft**.
- The Compile View gains a visible completion/progress indicator.
- Progress is calculated as `completed required Sections / all required Sections`.
- A trusted Compiler explicitly marks a Liturgy **Ready for publication**.
- The server validates completion before accepting that transition.
- Any subsequent content mutation automatically returns the Liturgy to Draft.
- Readiness records who marked it ready and when.
- Saturday publication uses the current server-authoritative readiness state; n8n never infers readiness from raw Item counts.

### Completion policy

Template Sections are classified as:

- **Required:** included in the progress denominator and must contain qualifying substantive content.
- **Optional:** visible in diagnostics but excluded from the denominator.
- **Structural:** intentionally heading-only and excluded from completion calculations.

The initial classification is:

- Every Section is Required unless explicitly classified otherwise.
- Morning **Pastoral Prayer** is Optional and may legitimately remain empty.
- Vesper **Prayer Meeting** and **The Lord’s Table** are Structural.
- A default seeded Verbal Cue does not satisfy a Required Section by itself.
- Automatically assigned real Vesper readings do count as substantive published content.
- **Ready for publication** is unavailable until all Required Sections pass their completion rules.

### Integration boundary

- n8n calls a protected API owned by this Next.js application.
- n8n does not connect directly to the Liturgy Compiler’s Supabase database and does not receive its service-role key.
- The application remains authoritative for Liturgy creation, Morning cue seeding, Vesper reading assignment, completion policy, readiness, auto-draft behavior, and publication idempotency.
- n8n owns schedules, branching, email delivery, retries, and workflow-level monitoring.
- A dedicated automation credential is stored separately in Vercel and n8n.
- A webhook from the application to n8n may be added later, but it is not the authoritative publication mechanism. n8n must re-read current readiness immediately before distribution because later edits can return a Liturgy to Draft.

### Notification channel

- Email is the first supported channel.
- WhatsApp is explicitly deferred.
- Because Render Free blocks ordinary outbound SMTP ports, the intended email path is n8n’s Gmail API node or another HTTPS-based provider, not a direct SMTP connection.
- The application API should remain channel-neutral so WhatsApp can be added without changing domain behavior.

### Free-platform posture

- Supabase Free has ample request, database, and egress capacity for this workflow.
- Vercel Hobby has ample function capacity for the protected API at this expected volume.
- Self-hosted n8n Community is suitable for this internal workflow without an n8n Cloud subscription.
- n8n runs on a Render Free web service and is kept active by UptimeRobot.
- UptimeRobot Free checks every five minutes, inside Render’s 15-minute idle window.
- n8n state is confirmed to use a separate Supabase Postgres database and has survived Render redeployments/restarts; it is not dependent on Render’s ephemeral filesystem.
- The n8n deployment has a stable `N8N_ENCRYPTION_KEY`/external-database arrangement according to the owner’s confirmation; secret values must never be copied into project files or chat.
- The design accepts Free-tier reliability rather than an uptime SLA. It requires idempotency, retries, failure alerts, and a documented manual publication fallback.

## Proposed architecture direction

This direction is agreed conceptually, but endpoint names and data contracts remain part of the unfinished charter:

```text
UptimeRobot keeps n8n reachable
            ↓
n8n Schedule Trigger (Asia/Manila)
            ↓ HTTPS + dedicated automation credential
Liturgy Compiler automation API on Vercel
            ↓ authorized server-only domain logic
Supabase
            ↓ structured status/publication response
n8n Gmail API node
            ↓
Internal compilers or publication recipients
```

Candidate API responsibilities—not final endpoint names:

- Idempotently ensure the Sunday Morning and Vesper Liturgies exist.
- Return a safe structured weekly status for both Liturgies.
- Return each Liturgy’s progress, missing requirements, readiness, Compile View URL, and public Web View URL.
- Record a successful publication delivery/idempotency key so retries cannot duplicate it.

## Open decisions — resume the charter here

1. **Exact schedule:** Choose Monday, Wednesday, and Friday send times; choose Saturday’s polling window, polling interval, and final cutoff in `Asia/Manila`. Hourly Saturday polling was recommended but not yet finalized.
2. **Saturday cutoff behavior:** Confirm the exact internal alert and manual fallback when a Liturgy is still Draft at cutoff.
3. **Publication revision behavior:** Decide what happens if a Liturgy is edited after it has already been distributed—whether a newly approved revision may be redistributed automatically or requires a distinct manual action.
4. **Qualifying completion predicates:** Define the substantive Item requirement for each Required Section. The classification model is approved; the per-Section predicates are not yet enumerated.
5. **Progress-bar placement and presentation:** Decide the exact Compile View location, compact/expanded diagnostic treatment, and how missing Required Sections link or scroll to their editing surfaces.
6. **Recipients:** Decide who receives Monday/Wednesday/Friday compiler-status emails, who receives Saturday publication emails, and where those address lists are managed.
7. **Email provider:** Confirm the Gmail/Google account or other HTTPS email provider n8n will use and who owns credential maintenance.
8. **Saturday payload:** Confirm whether publication sends only the public Web View link or also includes the Congregation Bulletin DOCX.
9. **API contract:** Finalize endpoint structure, request/response schemas, authentication mechanism, credential rotation, rate limiting, and safe logging/redaction.
10. **Publication ledger:** Decide the minimal database fields or table needed for readiness, ready revision, delivery attempts, successful deliveries, and independent Morning/Vesper idempotency.
11. **Auto-draft coverage:** Enumerate every content mutation that invalidates readiness and ensure internal/automated writes do not accidentally cause inappropriate state transitions.
12. **Existing-Liturgy behavior:** Confirm Monday’s behavior when one or both Liturgies already exist, including a pre-existing Liturgy already marked Ready for publication.
13. **Operational monitoring:** Configure an UptimeRobot heartbeat/cron monitor for successful n8n workflow execution, not merely HTTP availability, and define alert ownership.
14. **Render capacity check:** Confirm this n8n service is the only continuously active Free service drawing from the Render workspace’s shared 750 monthly Free instance-hours, or explicitly accept the remaining capacity risk.
15. **Manual fallback:** Document how an authorized person publishes the Web View link manually if n8n, Render, Vercel, or Supabase is unavailable.

## Boundaries and invariants

- Do not bypass the application’s authorization boundary with direct n8n access to the Liturgy Compiler service-role key.
- Public reading remains anonymous; application mutations remain authenticated as a human Curator/Compiler or an explicitly authorized machine principal.
- Morning cue seeding and Vesper recurring-reading assignment must reuse the existing domain logic rather than be duplicated in n8n.
- Morning and Vesper retain their established Template/Section vocabulary.
- AB2001/MBB copyright boundaries are unaffected; the automation must never fetch, store, or include that text.
- DOCX remains the active artifact format; the frozen PDF path does not define this feature.
- Do not modify or couple this feature to the separate in-progress Library Production-to-local snapshot/restore work.

## Cost and reliability findings

- Supabase Free: unlimited API requests, 500 MB database, 5 GB egress; low-activity projects may pause after seven days.
- Supabase says a few user database requests per day are typically enough to avoid pausing, but Pro is the only guarantee.
- Vercel Hobby: the proposed API traffic is negligible relative to included function usage. Hobby’s personal/non-commercial eligibility remains an account-policy consideration for the owner.
- Render Free: 750 shared instance-hours per workspace per month; one continuously active service narrowly fits even a 31-day month, but other Free services consume the same pool. Render may restart a Free service at any time.
- Render Free filesystems are ephemeral and Render Free Postgres expires after 30 days; neither is used as the n8n state authority here.
- UptimeRobot Free: five-minute monitoring is sufficient to keep requests arriving inside Render’s idle window. A separate success heartbeat is still needed to detect scheduler/workflow failure.

## Primary references checked during chartering

- [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase pricing and Free limits](https://supabase.com/pricing)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Render Free instances](https://render.com/docs/free)
- [Render Cron Jobs](https://render.com/docs/cronjobs)
- [UptimeRobot monitoring intervals](https://help.uptimerobot.com/en/articles/11360876-what-is-a-monitoring-interval-in-uptimerobot)
- [n8n Gmail message operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/)

## Handoff instruction

In the next session, invoke the `charter` skill, restore project memory first, read this draft and `context/architecture.md`, inspect current Git/worktree reality, and resume at **Open decisions**. Do not implement until the charter reaches an explicitly confirmed Implementation Plan.
