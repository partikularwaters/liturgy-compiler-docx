import SectionCard from "@/components/liturgy/SectionCard";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { groupSectionsByPageColumn } from "@/lib/liturgy/groupSectionsByPageColumn";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";

interface CompileViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompileViewPage({ params }: CompileViewPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [liturgy, formulas, prayers] = await Promise.all([
    getLiturgy(id),
    getFormulas(),
    getPrayers(),
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

  const downloadButtons = (
    <div className="flex items-center gap-3">
      <a
        href={`/api/liturgy/${liturgy.id}/export?audience=guide`}
        className="bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
      >
        Download Leader Guide
      </a>
      <a
        href={`/api/liturgy/${liturgy.id}/export?audience=bulletin`}
        className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
      >
        Download Congregation Bulletin
      </a>
    </div>
  );

  // Vesper has no PDF export in v1 (deferred to v3/v4) -- a shareable web
  // view replaces it instead. Morning also gets this link now (2026-07-15,
  // extending Feature 18 past its original Vesper-only scope) alongside its
  // existing PDF buttons, since LiturgyWebView was already verified to work
  // for Morning unmodified.
  const viewLink = (
    <a
      href={`/liturgy/${liturgy.id}/view`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
    >
      View / Share Liturgy
    </a>
  );

  const bulletinHeading = (
    <div className="flex flex-col gap-1">
      <h1 className="font-serif-display text-[22px] font-semibold leading-[30px] text-text-primary">
        {liturgy.templateName}
      </h1>
      <p className="text-[13px] text-text-secondary">
        {liturgy.serviceDate}
        {dateIsSunday && ` — Lord’s Day ${liturgy.lordsDayNumber}`}
      </p>
    </div>
  );

  if (!grouped) {
    // No page/column data (Vesper, Feature 18 pending) — flat single-column list.
    return (
      <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          {bulletinHeading}
          {viewLink}
        </div>
        {liturgy.sections.map((section, index) => (
          <SectionCard
            key={index}
            section={section}
            liturgyId={liturgy.id}
            sectionIndex={index}
            formulas={formulas}
            prayers={prayers}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
      <div className="flex items-center justify-end gap-3">
        {viewLink}
        {downloadButtons}
      </div>
      {grouped.map((pageGroup) => (
        <div key={pageGroup.page} className="flex flex-col gap-3">
          <p className="text-[12px] font-medium uppercase text-text-muted">Page {pageGroup.page}</p>
          <div className="grid grid-cols-3 gap-6 items-start">
            {pageGroup.columns.map((columnGroup) => (
              <div key={columnGroup.column} className="flex flex-col gap-6">
                {pageGroup.page === 1 && columnGroup.column === 1 && bulletinHeading}
                {columnGroup.sections.map(({ section, index }) => (
                  <SectionCard
                    key={index}
                    section={section}
                    liturgyId={liturgy.id}
                    sectionIndex={index}
                    formulas={formulas}
                    prayers={prayers}
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
