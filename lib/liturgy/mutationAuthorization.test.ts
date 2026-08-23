import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  firstEq: vi.fn(),
  secondEq: vi.fn(),
  getSectionContext: vi.fn(),
  addSelection: vi.fn(),
  updateSelectionItem: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/lib/liturgy/getSectionContext", () => ({
  getSectionContext: mocks.getSectionContext,
}));

vi.mock("@/lib/liturgy/addSelectionAction", () => ({
  addSelection: mocks.addSelection,
  updateSelectionItem: mocks.updateSelectionItem,
}));

import { chooseVesperReading } from "@/lib/liturgy/chooseVesperReadingAction";
import { setColumnBreak } from "@/lib/liturgy/setColumnBreakAction";
import { setShowPrayerGuide } from "@/lib/liturgy/setShowPrayerGuideAction";

describe("liturgy mutation authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.secondEq.mockResolvedValue({ error: null });
    mocks.firstEq.mockReturnValue({ eq: mocks.secondEq });
    mocks.update.mockReturnValue({ eq: mocks.firstEq });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.addSelection.mockResolvedValue({ success: true });
  });

  it("denies anonymous Prayer Guide changes before touching the database", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const result = await setShowPrayerGuide("liturgy-id", 3, false);

    expect(result).toEqual({
      success: false,
      error: "Sign in to change this Prayer Guide setting.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("denies anonymous column changes before touching the database", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const result = await setColumnBreak("liturgy-id", 3, true);

    expect(result).toEqual({
      success: false,
      error: "Sign in to change this column setting.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("denies an anonymous Vesper choice before reading privileged context", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const result = await chooseVesperReading("liturgy-id", 7, "John 4:1–42");

    expect(result).toEqual({
      success: false,
      error: "Sign in to choose this Vesper reading.",
    });
    expect(mocks.getSectionContext).not.toHaveBeenCalled();
    expect(mocks.addSelection).not.toHaveBeenCalled();
  });

  it("allows a trusted editor through each repaired boundary", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "editor-id",
      email: "editor@example.test",
      role: "compiler",
    });
    mocks.getSectionContext.mockResolvedValue({ id: "section-id", sectionName: "Words of Institution", items: [] });

    await expect(setShowPrayerGuide("liturgy-id", 3, false)).resolves.toEqual({ success: true });
    await expect(setColumnBreak("liturgy-id", 3, true)).resolves.toEqual({ success: true });
    await expect(chooseVesperReading("liturgy-id", 8, "Luke 22:7–21")).resolves.toEqual({
      success: true,
      error: undefined,
    });

    expect(mocks.from).toHaveBeenCalledWith("sections");
    expect(mocks.addSelection).toHaveBeenCalledWith("liturgy-id", 8, "Luke 22:7–21", "");
  });
});

