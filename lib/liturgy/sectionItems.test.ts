import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/types/liturgy";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  markDraft: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));
vi.mock("@/lib/liturgy/markDraft", () => ({
  markDraft: mocks.markDraft,
}));

import { insertSectionItem, updateSectionItem, deleteSectionItem } from "@/lib/liturgy/sectionItems";

function itemOfType(type: Item["type"]): Item {
  switch (type) {
    case "selection":
      return { id: "item-1", type, text: "text", citation: "Ps 1:1" };
    case "formula":
      return { id: "item-1", type, formulaId: "f1", overrideText: null, visibility: "both" };
    case "verbal_cue":
      return { id: "item-1", type, text: "cue", visibility: "both" };
    case "prayer":
      return { id: "item-1", type, prayerId: "p1" };
    case "sermon":
      return { id: "item-1", type, passage: "John 3:16" };
    case "song":
      return { id: "item-1", type, songId: "s1" };
  }
}

const ALL_TYPES: Item["type"][] = ["selection", "formula", "verbal_cue", "prayer", "sermon", "song"];

describe("sectionItems write chokepoints invalidate readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markDraft.mockResolvedValue({ success: true });
  });

  describe("insertSectionItem", () => {
    it.each(ALL_TYPES)("flips a Ready Liturgy back to Draft when placing a %s item", async (type) => {
      mocks.from.mockImplementation((table: string) => {
        if (table === "section_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "sections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { liturgy_id: "liturgy-1" }, error: null }),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await insertSectionItem("section-1", itemOfType(type));

      expect(result.success).toBe(true);
      expect(mocks.markDraft).toHaveBeenCalledWith("liturgy-1");
    });

    it("does not fail the insert when resolving the liturgy id fails", async () => {
      mocks.from.mockImplementation((table: string) => {
        if (table === "section_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "sections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await insertSectionItem("section-1", itemOfType("selection"));

      expect(result.success).toBe(true);
      expect(mocks.markDraft).not.toHaveBeenCalled();
    });
  });

  describe("updateSectionItem", () => {
    it.each(ALL_TYPES)("flips a Ready Liturgy back to Draft when editing a %s item", async (type) => {
      mocks.from.mockImplementation((table: string) => {
        if (table === "section_items") {
          return {
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { sections: { liturgy_id: "liturgy-1" } }, error: null }),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await updateSectionItem(itemOfType(type));

      expect(result.success).toBe(true);
      expect(mocks.markDraft).toHaveBeenCalledWith("liturgy-1");
    });
  });

  describe("deleteSectionItem", () => {
    it.each(ALL_TYPES)("resolves the liturgy id before deleting a %s item, then flips Ready back to Draft", async (type) => {
      const callOrder: string[] = [];
      mocks.from.mockImplementation((table: string) => {
        if (table === "section_items") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockImplementation(async () => {
                  callOrder.push("resolve");
                  return { data: { sections: { liturgy_id: "liturgy-1" } }, error: null };
                }),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn().mockImplementation(async () => {
                callOrder.push("delete");
                return { error: null };
              }),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await deleteSectionItem(itemOfType(type).id);

      expect(result.success).toBe(true);
      expect(mocks.markDraft).toHaveBeenCalledWith("liturgy-1");
      expect(callOrder).toEqual(["resolve", "delete"]);
    });
  });
});
