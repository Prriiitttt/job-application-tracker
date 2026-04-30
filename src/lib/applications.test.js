import { describe, it, expect } from "vitest";
import {
  countByStatus,
  filterApplications,
  getStatusChartData,
  getWeeklyData,
  getStreak,
  getThisWeekCount,
  getStatusStyle,
  APPLICATION_STATUSES,
} from "./applications";

const sample = [
  { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied" },
  { id: 2, company: "Beta", role: "Designer", data: "2026-01-12", status: "interview" },
  { id: 3, company: "Cog", role: "Manager", data: "2026-01-15", status: "rejected" },
  { id: 4, company: "Acme", role: "Engineer", data: "2026-01-16", status: "applied" },
];

describe("countByStatus", () => {
  it("returns zeros for an empty array", () => {
    expect(countByStatus([])).toEqual({ total: 0, applied: 0, interview: 0, rejected: 0 });
  });

  it("returns zeros for a non-array input", () => {
    expect(countByStatus(null)).toEqual({ total: 0, applied: 0, interview: 0, rejected: 0 });
    expect(countByStatus(undefined)).toEqual({ total: 0, applied: 0, interview: 0, rejected: 0 });
    expect(countByStatus("nope")).toEqual({ total: 0, applied: 0, interview: 0, rejected: 0 });
  });

  it("counts each status correctly", () => {
    expect(countByStatus(sample)).toEqual({ total: 4, applied: 2, interview: 1, rejected: 1 });
  });

  it("ignores items with unknown statuses (does not affect total)", () => {
    expect(countByStatus([{ status: "weird" }])).toEqual({
      total: 0,
      applied: 0,
      interview: 0,
      rejected: 0,
    });
  });

  it("ignores null/undefined items entirely", () => {
    expect(countByStatus([null, undefined, { status: "applied" }])).toEqual({
      total: 1,
      applied: 1,
      interview: 0,
      rejected: 0,
    });
  });

  it("guarantees total === applied + interview + rejected for any input", () => {
    const inputs = [
      [],
      [{ status: "applied" }, { status: "interview" }, { status: "rejected" }],
      [null, { status: "weird" }, { status: "applied" }, undefined],
      sample,
      [{ status: "applied" }, { status: "applied" }, { status: "garbage" }],
    ];
    for (const input of inputs) {
      const c = countByStatus(input);
      expect(c.total).toBe(c.applied + c.interview + c.rejected);
    }
  });

  it("exposes the canonical status list", () => {
    expect(APPLICATION_STATUSES).toEqual(["applied", "interview", "rejected"]);
  });
});

describe("filterApplications", () => {
  it("returns all when status is 'all' and search is empty", () => {
    expect(filterApplications(sample, { status: "all", search: "" })).toHaveLength(4);
  });

  it("uses defaults when no options are provided", () => {
    expect(filterApplications(sample)).toHaveLength(4);
  });

  it("filters by status only", () => {
    expect(filterApplications(sample, { status: "applied" })).toHaveLength(2);
    expect(filterApplications(sample, { status: "interview" })).toHaveLength(1);
    expect(filterApplications(sample, { status: "rejected" })).toHaveLength(1);
  });

  it("matches search case-insensitively against company", () => {
    expect(filterApplications(sample, { search: "ACME" })).toHaveLength(2);
    expect(filterApplications(sample, { search: "acme" })).toHaveLength(2);
  });

  it("matches partial substrings against role", () => {
    expect(filterApplications(sample, { search: "design" })).toHaveLength(1);
  });

  it("returns empty when nothing matches", () => {
    expect(filterApplications(sample, { search: "zzz" })).toEqual([]);
  });

  it("combines status + search", () => {
    expect(
      filterApplications(sample, { status: "applied", search: "acme" })
    ).toHaveLength(2);
    expect(
      filterApplications(sample, { status: "interview", search: "acme" })
    ).toHaveLength(0);
  });

  it("treats missing company/role gracefully", () => {
    const apps = [{ id: 1, status: "applied" }];
    expect(filterApplications(apps, { search: "anything" })).toEqual([]);
    expect(filterApplications(apps, { search: "" })).toHaveLength(1);
  });

  it("handles non-array input by returning []", () => {
    expect(filterApplications(null)).toEqual([]);
    expect(filterApplications(undefined)).toEqual([]);
  });

  it("matches unicode in company names", () => {
    expect(filterApplications([{ company: "東京テック", role: "x", status: "applied" }], { search: "東京" })).toHaveLength(1);
  });
});

describe("getStatusChartData", () => {
  it("returns three slices in fixed order with colors", () => {
    const result = getStatusChartData(sample);
    expect(result).toEqual([
      { name: "Applied", value: 2, color: "#4f8ef7" },
      { name: "Interview", value: 1, color: "#00e5a0" },
      { name: "Rejected", value: 1, color: "#ff6b6b" },
    ]);
  });

  it("returns zeros when no applications", () => {
    expect(getStatusChartData([])).toEqual([
      { name: "Applied", value: 0, color: "#4f8ef7" },
      { name: "Interview", value: 0, color: "#00e5a0" },
      { name: "Rejected", value: 0, color: "#ff6b6b" },
    ]);
  });
});

describe("getWeeklyData", () => {
  it("groups applications by Monday-anchored week", () => {
    // 2026-01-12 is a Monday; 2026-01-15 is the same week
    const apps = [
      { data: "2026-01-12", status: "applied" },
      { data: "2026-01-15", status: "applied" },
    ];
    const result = getWeeklyData(apps);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it("groups Sunday into the previous week (Monday-anchored)", () => {
    const apps = [
      { data: "2026-01-12", status: "applied" }, // Mon
      { data: "2026-01-18", status: "applied" }, // Sun → same week
    ];
    expect(getWeeklyData(apps)).toHaveLength(1);
  });

  it("returns empty for empty input", () => {
    expect(getWeeklyData([])).toEqual([]);
  });

  it("returns empty for non-array input", () => {
    expect(getWeeklyData(null)).toEqual([]);
  });

  it("limits to the last 6 weeks by default", () => {
    const apps = Array.from({ length: 12 }, (_, i) => ({
      data: `2026-${String(Math.floor(i / 4) + 1).padStart(2, "0")}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
      status: "applied",
    }));
    expect(getWeeklyData(apps).length).toBeLessThanOrEqual(6);
  });

  it("respects a custom limit", () => {
    const apps = [
      { data: "2026-01-05", status: "applied" },
      { data: "2026-01-12", status: "applied" },
      { data: "2026-01-19", status: "applied" },
    ];
    expect(getWeeklyData(apps, { limit: 2 })).toHaveLength(2);
  });

  it("ignores apps with missing or invalid date", () => {
    const apps = [
      { data: undefined, status: "applied" },
      { data: "not-a-date", status: "applied" },
      { data: "2026-01-12", status: "applied" },
    ];
    expect(getWeeklyData(apps)).toHaveLength(1);
  });
});

describe("getStreak", () => {
  it("counts consecutive days backwards from today", () => {
    const today = new Date("2026-01-20T12:00:00");
    const apps = [
      { data: "2026-01-20" },
      { data: "2026-01-19" },
      { data: "2026-01-18" },
    ];
    expect(getStreak(apps, today)).toBe(3);
  });

  it("returns 0 if today's application is missing", () => {
    const today = new Date("2026-01-20T12:00:00");
    const apps = [{ data: "2026-01-19" }];
    expect(getStreak(apps, today)).toBe(0);
  });

  it("stops counting on the first gap", () => {
    const today = new Date("2026-01-20T12:00:00");
    const apps = [
      { data: "2026-01-20" },
      { data: "2026-01-19" },
      // gap on 2026-01-18
      { data: "2026-01-17" },
    ];
    expect(getStreak(apps, today)).toBe(2);
  });

  it("returns 0 for empty list", () => {
    expect(getStreak([], new Date("2026-01-20T12:00:00"))).toBe(0);
  });

  it("returns 0 for non-array input", () => {
    expect(getStreak(null)).toBe(0);
  });

  it("does not double-count duplicate dates", () => {
    const today = new Date("2026-01-20T12:00:00");
    const apps = [
      { data: "2026-01-20" },
      { data: "2026-01-20" },
      { data: "2026-01-20" },
    ];
    expect(getStreak(apps, today)).toBe(1);
  });
});

describe("getThisWeekCount", () => {
  it("counts apps from Monday through today", () => {
    const today = new Date("2026-01-15T12:00:00"); // Thursday
    const apps = [
      { data: "2026-01-12" }, // Mon
      { data: "2026-01-13" },
      { data: "2026-01-15" }, // today
      { data: "2026-01-11" }, // last Sunday — outside
    ];
    expect(getThisWeekCount(apps, today)).toBe(3);
  });

  it("treats Sunday as part of the previous Mon-Sun week", () => {
    const today = new Date("2026-01-18T12:00:00"); // Sunday
    const apps = [
      { data: "2026-01-12" }, // Mon
      { data: "2026-01-18" }, // today (Sun)
    ];
    expect(getThisWeekCount(apps, today)).toBe(2);
  });

  it("returns 0 for empty list", () => {
    expect(getThisWeekCount([], new Date("2026-01-15T12:00:00"))).toBe(0);
  });

  it("returns 0 for non-array input", () => {
    expect(getThisWeekCount(null)).toBe(0);
  });

  it("ignores apps with missing date", () => {
    const today = new Date("2026-01-15T12:00:00");
    const apps = [{ data: null }, { data: undefined }];
    expect(getThisWeekCount(apps, today)).toBe(0);
  });
});

describe("getStatusStyle", () => {
  it("returns style for known statuses", () => {
    expect(getStatusStyle("applied")).toEqual({
      background: "rgba(79,142,247,0.15)",
      color: "#4f8ef7",
    });
    expect(getStatusStyle("interview")).toEqual({
      background: "rgba(0,229,160,0.15)",
      color: "#00e5a0",
    });
    expect(getStatusStyle("rejected")).toEqual({
      background: "rgba(255,107,107,0.15)",
      color: "#ff6b6b",
    });
  });

  it("returns undefined for unknown status", () => {
    expect(getStatusStyle("nope")).toBeUndefined();
    expect(getStatusStyle(undefined)).toBeUndefined();
    expect(getStatusStyle(null)).toBeUndefined();
  });
});
