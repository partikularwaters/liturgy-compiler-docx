import SectionCard from "@/components/liturgy/SectionCard";
import CopyLinkButton from "@/components/liturgy/CopyLinkButton";
import EndNoteToggle from "@/components/liturgy/EndNoteToggle";
import { DownloadIcon } from "@/components/liturgy/icons";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getSongs } from "@/lib/songs/getSongs";
import { getScriptureSelections } from "@/lib/selections/getScriptureSelections";
import { groupSectionsByPageColumn } from "@/lib/liturgy/groupSectionsByPageColumn";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";

// Always reads live data -- otherwise a just-saved toggle (End Note, Prayer
// Guide, column break) or library edit can look reverted after
// router.refresh() if Next serves a cached fetch response (same bug class
// fixed on the homepage and Library page).
export const dynamic = "force-dynamic";

interface CompileViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompileViewPage({ params }: CompileViewPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [liturgy, formulas, prayers, songs, scriptureSelections] = await Promise.all([
    getLiturgy(id),
    getFormulas(),
    getPrayers(),
    getSongs(),
    getScriptureSelections(),
  ]);

  if (!liturgy) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Liturgy not found.</p>
      </div>
    );
  }

  const dateIsSunday = isSunday(parseLocalDate(liturgy.serviceDate));
  const grouped = groupSectionsByPageColumn(liturgy.sections);

  // docx is the only export mechanism surfaced here for now --
  // PDF download links removed;
  // lib/pdf/ itself stays untouched/frozen, this is just a UI removal.
  const downloadButtons = (
    <div className="flex items-center gap-3">
      <a
        href={`/api/liturgy/${liturgy.id}/export?audience=guide&format=docx`}
        className="flex items-center gap-2 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
      >
        <DownloadIcon size={15} />
        Guide (.docx)
      </a>
      <a
        href={`/api/liturgy/${liturgy.id}/export?audience=bulletin&format=docx`}
        className="flex items-center gap-2 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
      >
        <DownloadIcon size={15} />
        Bulletin (.docx)
      </a>
    </div>
  );

  // Vesper has no PDF export in v1 (deferred to v3/v4) -- a shareable web
  // view replaces it instead. Morning also gets this link, since
  // LiturgyWebView works for Morning unmodified.
  const viewLink = <CopyLinkButton path={`/liturgy/${liturgy.id}/view`} />;

  // Feature 28 Part A: title ~14pt bold all-caps, metadata ~12pt small caps
  // right-aligned on one line -- matches the reference bulletin exactly
  // (redesign-plan-v1.1.md §AB), not the earlier centered-two-line guess.
  const formattedDate = parseLocalDate(liturgy.serviceDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const bulletinHeading = (
    <div className="flex flex-col gap-1">
      <h1 className="font-serif-body text-[19px] font-bold uppercase text-text-primary">
        {liturgy.templateName} Service
      </h1>
      <p className="font-serif-body text-[16px] text-text-secondary text-right [font-variant:small-caps]">
        {formattedDate}
        {dateIsSunday && `   Lord’s Day #${liturgy.lordsDayNumber}`}
      </p>
    </div>
  );

  // v2 items 1-2: Vesper never got a PDF (architecture.md — falls back to a
  // flat single-column layout no export links pointed to), but docx export
  // doesn't need groupSectionsByPageColumn's page/column data at all — Word's
  // native continuous-flow columns make that grouping unnecessary for either
  // template (build-plan.md's v2 item 2: "resolves Vesper's 3-column layout
  // as a side effect"). So Vesper gets real docx download links here too --
  // same downloadButtons as Morning, no PDF equivalent for either now.
  if (!grouped) {
    // No page/column data (Vesper, Feature 18 pending) — flat single-column list.
    return (
      <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          {bulletinHeading}
          <div className="flex items-center gap-3">
            <EndNoteToggle liturgyId={liturgy.id} templateName={liturgy.templateName} showEndNote={liturgy.showEndNote} />
            {viewLink}
            {downloadButtons}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {liturgy.sections.map((section, index) => (
            <SectionCard
              key={index}
              section={section}
              liturgyId={liturgy.id}
              sectionIndex={index}
              formulas={formulas}
              prayers={prayers}
              songs={songs}
              scriptureSelections={scriptureSelections}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
      <div className="flex items-center justify-end gap-3">
        <EndNoteToggle liturgyId={liturgy.id} templateName={liturgy.templateName} showEndNote={liturgy.showEndNote} />
        {viewLink}
        {downloadButtons}
      </div>
      {grouped.map((pageGroup) => (
        // A bounding box per page so the
        // Page 1/Page 2 boundary reads clearly at a glance, instead of two
        // page labels with visually identical content underneath them.
        <div key={pageGroup.page} className="flex flex-col gap-3 border-2 border-border rounded-lg p-6">
          <p className="text-[12px] font-medium uppercase text-text-muted">Page {pageGroup.page}</p>
          <div className="grid grid-cols-3 gap-6 items-start">
            {pageGroup.columns.map((columnGroup) => (
              <div key={columnGroup.column} className="flex flex-col gap-4">
                {pageGroup.page === 1 && columnGroup.column === 1 && bulletinHeading}
                {columnGroup.sections.map(({ section, index }) => (
                  <SectionCard
                    key={index}
                    section={section}
                    liturgyId={liturgy.id}
                    sectionIndex={index}
                    formulas={formulas}
                    prayers={prayers}
                    songs={songs}
                    scriptureSelections={scriptureSelections}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
