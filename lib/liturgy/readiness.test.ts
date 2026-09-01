import { describe, expect, it } from "vitest";
import { computeProgress } from "./readiness";
import type { CompiledLiturgy, CompiledSection, Item } from "@/types/liturgy";

function item(type: Item["type"]): Item {
  switch (type) {
    case "selection":
      return { id: "selection", type, text: "Selection", citation: "Psalms 1:1" };
    case "formula":
      return { id: "formula", type, formulaId: "formula", overrideText: null, visibility: "both" };
    case "verbal_cue":
      return { id: "cue", type, text: "Cue", visibility: "both" };
    case "prayer":
      return { id: "prayer", type, prayerId: "prayer" };
    case "sermon":
      return { id: "sermon", type, passage: "John 3:16" };
    case "song":
      return { id: "song", type, songId: "song" };
  }
}

function section(name: string, items: Item[] = []): CompiledSection {
  return {
    name,
    posture: "standing",
    dynamic_naming: false,
    items,
    columnBreakBefore: false,
    showPrayerGuide: true, silentConfessionLanguage: "fil", mergeSelections: false,
  };
}

function liturgy(templateName: string, sections: CompiledSection[]): CompiledLiturgy {
  return {
    id: "liturgy",
    templateName,
    serviceDate: "2026-08-30",
    lordsDayNumber: 35,
    sections,
    showEndNote: true,
    status: "draft",
    readyAt: null,
  };
}

describe("computeProgress", () => {
  it("recognizes a Section with a single required item type as present or absent", () => {
    expect(computeProgress(liturgy("Morning Worship", [section("Call to Worship", [item("selection")])]))).toMatchObject({
      completed: 1,
      total: 1,
      missing: [],
    });
    expect(computeProgress(liturgy("Morning Worship", [section("Call to Worship")]))).toMatchObject({
      completed: 0,
      total: 1,
      missing: ["Call to Worship"],
    });
  });

  it("requires a Prayer for Morning's Confession of Sin, not a Selection -- that Section never offers a Selection at all", () => {
    const withPrayer = computeProgress(liturgy("Morning Worship", [section("Confession of Sin", [item("prayer")])]));
    const withSelectionOnly = computeProgress(liturgy("Morning Worship", [section("Confession of Sin", [item("selection")])]));

    expect(withPrayer).toMatchObject({ completed: 1, total: 1, missing: [] });
    expect(withSelectionOnly).toMatchObject({ completed: 0, total: 1, missing: ["Confession of Sin"] });
  });

  it("requires both Assurance of Pardon item types", () => {
    const both = computeProgress(liturgy("Morning Worship", [section("Assurance of Pardon", [item("selection"), item("formula")])]));
    const onlySelection = computeProgress(liturgy("Morning Worship", [section("Assurance of Pardon", [item("selection")])]));
    const neither = computeProgress(liturgy("Morning Worship", [section("Assurance of Pardon")]));

    expect(both).toMatchObject({ completed: 1, total: 1, missing: [] });
    expect(onlySelection).toMatchObject({ completed: 0, total: 1, missing: ["Assurance of Pardon"] });
    expect(neither).toMatchObject({ completed: 0, total: 1, missing: ["Assurance of Pardon"] });
  });

  it("treats optional Sections as complete without counting them", () => {
    const progress = computeProgress(liturgy("Morning Worship", [section("Prayer for Illumination")]));

    expect(progress).toMatchObject({ completed: 0, total: 0, missing: [] });
    expect(progress.sections).toEqual([{ name: "Prayer for Illumination", class: "optional", complete: true }]);
  });

  it("always completes structural Sections without counting them", () => {
    const progress = computeProgress(liturgy("Vesper Worship", [section("The Lord’s Table")]));

    expect(progress).toMatchObject({ completed: 0, total: 0, missing: [] });
    expect(progress.sections).toEqual([{ name: "The Lord’s Table", class: "structural", complete: true }]);
  });

  it("computes a complete synthetic Morning liturgy", () => {
    const progress = computeProgress(
      liturgy("Morning Worship", [
        section("Call to Worship", [item("selection")]),
        section("Prayer of Invocation", [item("selection")]),
        section("Psalm of Adoration", [item("song")]),
        section("Righteousness of God", [item("selection")]),
        section("Call to Confession", [item("selection")]),
        section("Confession of Sin", [item("prayer")]),
        section("Hymn of Propitiation", [item("song")]),
        section("Assurance of Pardon", [item("selection"), item("formula")]),
        section("Prayer for Illumination"),
        section("Psalm of Proclamation", [item("song")]),
        section("Sermon", [item("sermon")]),
        section("Hymn of Dedication", [item("song")]),
        section("Affirmation of Faith", [item("formula")]),
        section("Offertory Call", [item("selection")]),
        section("Psalm of Thanksgiving", [item("song")]),
        section("Pastoral Prayer"),
        section("Charge"),
        section("Benediction", [item("selection")]),
        section("Doxology", [item("song")]),
      ]),
    );

    expect(progress).toMatchObject({ completed: 16, total: 16, missing: [] });
  });

  it("computes every missing required Section in a synthetic Vesper liturgy", () => {
    const progress = computeProgress(
      liturgy("Vesper Worship", [
        section("Call to Worship", [item("selection")]),
        section("Prayer of Invocation", [item("selection")]),
        section("Psalm of Adoration", [item("song")]),
        section("Confession of Sin", [item("selection")]),
        section("Prayer for Pardon"),
        section("Words of Thanksgiving", [item("selection")]),
        section("Psalm of Proclamation", [item("song")]),
        section("The Lord’s Discourses", [item("selection")]),
        section("Words of Institution", [item("selection")]),
        section("Prayer before Communion"),
        section("Hymn of Communion", [item("song")]),
        section("The Lord’s Table"),
        section("Closing of the Table", [item("selection")]),
        section("Affirmation of Faith", [item("formula")]),
        section("Offertory & Thanksgiving", [item("selection")]),
        section("Prayer Meeting"),
        section("The Great Commission"),
        section("Benediction", [item("selection")]),
        section("Doxology", [item("song")]),
      ]),
    );

    expect(progress).toMatchObject({
      completed: 13,
      total: 15,
      missing: ["Offertory & Thanksgiving", "The Great Commission"],
    });
  });
});
