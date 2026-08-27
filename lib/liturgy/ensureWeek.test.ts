import { beforeEach, describe, expect, it, vi } from "vitest";

interface LiturgyRow {
  id: string;
  templateId: string;
  serviceDate: string;
}

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  liturgies: [] as LiturgyRow[],
  rpcFailureAt: null as number | null,
  autoAssignVesperTableReadings: vi.fn().mockResolvedValue(undefined),
  seedMorningVerbalCues: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

// Real seeding/auto-assignment is exercised by liturgyDefaults.ts's own
// callers -- this test only needs to prove ensureWeek() calls the right
// one exactly once per freshly-created Liturgy, and never on reuse.
vi.mock("@/lib/liturgy/liturgyDefaults", () => ({
  autoAssignVesperTableReadings: mocks.autoAssignVesperTableReadings,
  seedMorningVerbalCues: mocks.seedMorningVerbalCues,
}));

import { ensureWeek } from "@/lib/liturgy/ensureWeek";

const TEMPLATE_IDS = {
  "Morning Worship": "morning-template-id",
  "Vesper Worship": "vesper-template-id",
} as const;

function templateQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn((_column: string, templateName: keyof typeof TEMPLATE_IDS) => ({
        single: vi.fn().mockResolvedValue({ data: { id: TEMPLATE_IDS[templateName], sections: [] }, error: null }),
      })),
    })),
  };
}

function liturgyQuery() {
  const filters = new Map<string, string>();
  const query = {
    eq: vi.fn((column: string, value: string) => {
      filters.set(column, value);
      return query;
    }),
    maybeSingle: vi.fn().mockImplementation(async () => ({
      data:
        mocks.liturgies.find(
          (liturgy) =>
            liturgy.templateId === filters.get("template_id") &&
            liturgy.serviceDate === filters.get("service_date")
        ) ?? null,
      error: null,
    })),
  };

  return { select: vi.fn(() => query) };
}

describe("ensureWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.liturgies.length = 0;
    mocks.rpcFailureAt = null;
    mocks.autoAssignVesperTableReadings.mockResolvedValue(undefined);
    mocks.seedMorningVerbalCues.mockResolvedValue(undefined);
    mocks.from.mockImplementation((table: string) => {
      if (table === "templates") return templateQuery();
      if (table === "liturgies") return liturgyQuery();
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.rpc.mockImplementation(async (_functionName: string, args: { p_template_id: string; p_service_date: string }) => {
      if (mocks.rpcFailureAt === mocks.rpc.mock.calls.length) {
        return { data: null, error: { message: "RPC unavailable" } };
      }

      const id = `liturgy-${mocks.liturgies.length + 1}`;
      mocks.liturgies.push({
        id,
        templateId: args.p_template_id,
        serviceDate: args.p_service_date,
      });
      return { data: id, error: null };
    });
  });

  it("creates both Sunday Liturgies once and reuses both on a later call", async () => {
    const first = await ensureWeek("2026-08-30");
    const second = await ensureWeek("2026-08-30");

    expect(first).toEqual({
      morningLiturgyId: "liturgy-1",
      vesperLiturgyId: "liturgy-2",
      morningCreated: true,
      vesperCreated: true,
    });
    expect(second).toEqual({
      morningLiturgyId: "liturgy-1",
      vesperLiturgyId: "liturgy-2",
      morningCreated: false,
      vesperCreated: false,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.liturgies).toHaveLength(2);
  });

  it("seeds Morning Verbal Cues and Vesper readings only for a freshly-created Liturgy, never on reuse", async () => {
    await ensureWeek("2026-08-30");

    expect(mocks.seedMorningVerbalCues).toHaveBeenCalledTimes(1);
    expect(mocks.seedMorningVerbalCues).toHaveBeenCalledWith("liturgy-1", []);
    expect(mocks.autoAssignVesperTableReadings).toHaveBeenCalledTimes(1);
    expect(mocks.autoAssignVesperTableReadings).toHaveBeenCalledWith("liturgy-2", "2026-08-30", []);

    await ensureWeek("2026-08-30");

    // Reused, not re-created -- neither seeding function should fire again.
    expect(mocks.seedMorningVerbalCues).toHaveBeenCalledTimes(1);
    expect(mocks.autoAssignVesperTableReadings).toHaveBeenCalledTimes(1);
  });

  it("fails closed when create_liturgy fails", async () => {
    mocks.rpcFailureAt = 2;

    await expect(ensureWeek("2026-08-30")).resolves.toBeNull();
    expect(mocks.liturgies).toHaveLength(1);
  });
});
