import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLiturgy: vi.fn(),
  getFormulas: vi.fn(),
  getPrayers: vi.fn(),
  getSongs: vi.fn(),
  toBuffer: vi.fn(),
  renderToStream: vi.fn(),
}));

vi.mock("@/lib/liturgy/getLiturgy", () => ({ getLiturgy: mocks.getLiturgy }));
vi.mock("@/lib/formulas/getFormulas", () => ({ getFormulas: mocks.getFormulas }));
vi.mock("@/lib/prayers/getPrayers", () => ({ getPrayers: mocks.getPrayers }));
vi.mock("@/lib/songs/getSongs", () => ({ getSongs: mocks.getSongs }));
vi.mock("docx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("docx")>();
  return { ...actual, Packer: { toBuffer: mocks.toBuffer } };
});
vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return { ...actual, renderToStream: mocks.renderToStream, Font: { register: vi.fn() } };
});

import { GET } from "@/app/api/liturgy/[id]/export/route";

const fakeLiturgy = {
  id: "abc",
  templateName: "Morning Worship",
  serviceDate: "2026-08-30",
  lordsDayNumber: 1,
  sections: [],
  showEndNote: true,
};

describe("GET /api/liturgy/[id]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLiturgy.mockResolvedValue(fakeLiturgy);
    mocks.getFormulas.mockResolvedValue([]);
    mocks.getPrayers.mockResolvedValue([]);
    mocks.getSongs.mockResolvedValue([]);
  });

  const call = (): Promise<Response> =>
    GET(new Request("https://example.com/api/liturgy/abc/export"), {
      params: Promise.resolve({ id: "abc" }),
    });

  it("fails closed instead of generating a document when a Formula read fails", async () => {
    mocks.getFormulas.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(502);
    expect(mocks.toBuffer).not.toHaveBeenCalled();
  });

  it("fails closed instead of generating a document when a Prayer read fails", async () => {
    mocks.getPrayers.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(502);
    expect(mocks.toBuffer).not.toHaveBeenCalled();
  });

  it("fails closed instead of generating a document when a Song read fails", async () => {
    mocks.getSongs.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(502);
    expect(mocks.toBuffer).not.toHaveBeenCalled();
  });

  it("still generates a document when every library read genuinely succeeds", async () => {
    mocks.toBuffer.mockResolvedValue(Buffer.from("fake-docx-bytes"));

    const response = await call();

    expect(response.status).toBe(200);
    expect(mocks.toBuffer).toHaveBeenCalledTimes(1);
  });
});
