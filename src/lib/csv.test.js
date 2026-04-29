import { describe, it, expect } from "vitest";
import { csvEscape, toCsv, applicationsToCSV, APPLICATION_CSV_HEADERS } from "./csv";

describe("csvEscape", () => {
  it("wraps a plain string in quotes", () => {
    expect(csvEscape("hello")).toBe('"hello"');
  });

  it("doubles internal quotes", () => {
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
  });

  it("preserves commas inside quotes (no special handling needed)", () => {
    expect(csvEscape("a,b,c")).toBe('"a,b,c"');
  });

  it("preserves newlines inside the quoted value", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("preserves CRLF inside the quoted value", () => {
    expect(csvEscape("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("converts numbers to strings", () => {
    expect(csvEscape(42)).toBe('"42"');
    expect(csvEscape(0)).toBe('"0"');
  });

  it("treats null and undefined as empty string", () => {
    expect(csvEscape(null)).toBe('""');
    expect(csvEscape(undefined)).toBe('""');
  });

  it("treats false as the string 'false'", () => {
    expect(csvEscape(false)).toBe('"false"');
  });

  it("preserves emoji and unicode", () => {
    expect(csvEscape("résumé 🚀 北京")).toBe('"résumé 🚀 北京"');
  });

  it("preserves RTL characters", () => {
    expect(csvEscape("שלום")).toBe('"שלום"');
  });
});

describe("toCsv", () => {
  it("joins rows with newlines and cells with commas", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe('"a","b"\n"c","d"');
  });

  it("returns empty string for empty input", () => {
    expect(toCsv([])).toBe("");
  });

  it("handles a single row with a single cell", () => {
    expect(toCsv([["x"]])).toBe('"x"');
  });
});

describe("applicationsToCSV", () => {
  const sample = [
    {
      company: "Acme",
      role: "Engineer",
      data: "2026-01-15",
      status: "applied",
      notes: "Referral",
    },
  ];

  it("starts with the header row", () => {
    const csv = applicationsToCSV(sample);
    const headerRow = csv.split("\n")[0];
    APPLICATION_CSV_HEADERS.forEach((h) => {
      expect(headerRow).toContain(h);
    });
  });

  it("emits one row per application", () => {
    const csv = applicationsToCSV([sample[0], sample[0], sample[0]]);
    expect(csv.split("\n")).toHaveLength(4); // header + 3
  });

  it("returns just the header row for an empty list", () => {
    const csv = applicationsToCSV([]);
    expect(csv).toBe(toCsv([APPLICATION_CSV_HEADERS]));
  });

  it("handles missing applications input gracefully", () => {
    expect(applicationsToCSV(null)).toBe(toCsv([APPLICATION_CSV_HEADERS]));
    expect(applicationsToCSV(undefined)).toBe(toCsv([APPLICATION_CSV_HEADERS]));
  });

  it("escapes commas, quotes, and newlines inside cells", () => {
    const csv = applicationsToCSV([
      {
        company: 'Acme, Inc. "Best"',
        role: "Engineer\nLead",
        data: "2026-01-15",
        status: "applied",
        notes: "n/a",
      },
    ]);
    expect(csv).toContain('"Acme, Inc. ""Best"""');
    expect(csv).toContain('"Engineer\nLead"');
  });

  it("uses empty string for missing notes", () => {
    const csv = applicationsToCSV([
      { company: "A", role: "B", data: "2026-01-01", status: "applied" },
    ]);
    expect(csv.endsWith(',""')).toBe(true);
  });
});
