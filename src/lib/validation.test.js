import { describe, it, expect } from "vitest";
import {
  validateApplicationForm,
  validateResumeFile,
  isImageFile,
  todayIsoDate,
  MAX_RESUME_BYTES,
} from "./validation";

describe("todayIsoDate", () => {
  it("returns YYYY-MM-DD format for the given date", () => {
    expect(todayIsoDate(new Date("2026-04-23T12:00:00Z"))).toBe("2026-04-23");
  });

  it("uses current date when no arg passed", () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("validateApplicationForm", () => {
  const baseDate = new Date("2026-04-23T12:00:00Z");
  const valid = {
    company: "Acme",
    role: "Engineer",
    data: "2026-01-15",
    status: "applied",
    notes: "",
  };

  it("returns no errors for a valid form", () => {
    expect(validateApplicationForm(valid, { now: baseDate })).toEqual({});
  });

  it("flags missing company", () => {
    expect(validateApplicationForm({ ...valid, company: "" }, { now: baseDate }).company).toBe(
      "Company is required"
    );
  });

  it("flags missing role", () => {
    expect(validateApplicationForm({ ...valid, role: "" }, { now: baseDate }).role).toBe(
      "Role is required"
    );
  });

  it("flags missing date", () => {
    expect(validateApplicationForm({ ...valid, data: "" }, { now: baseDate }).data).toBe(
      "Date is required"
    );
  });

  it("flags future date", () => {
    expect(
      validateApplicationForm({ ...valid, data: "2027-01-01" }, { now: baseDate }).data
    ).toBe("Date cannot be in the future");
  });

  it("accepts today's date", () => {
    expect(
      validateApplicationForm({ ...valid, data: "2026-04-23" }, { now: baseDate }).data
    ).toBeUndefined();
  });

  it("accepts past dates", () => {
    expect(
      validateApplicationForm({ ...valid, data: "2020-01-01" }, { now: baseDate }).data
    ).toBeUndefined();
  });

  it("returns multiple errors at once", () => {
    const errs = validateApplicationForm({}, { now: baseDate });
    expect(Object.keys(errs).sort()).toEqual(["company", "data", "role"]);
  });

  it("handles null/undefined input gracefully", () => {
    expect(Object.keys(validateApplicationForm(null, { now: baseDate })).sort()).toEqual([
      "company",
      "data",
      "role",
    ]);
    expect(Object.keys(validateApplicationForm(undefined, { now: baseDate })).sort()).toEqual([
      "company",
      "data",
      "role",
    ]);
  });
});

describe("validateResumeFile", () => {
  function fakeFile(size, name = "resume.pdf") {
    return { name, size, type: "application/pdf" };
  }

  it("accepts a small file", () => {
    expect(validateResumeFile(fakeFile(1024))).toEqual({ ok: true });
  });

  it("rejects a 0-byte file", () => {
    const result = validateResumeFile(fakeFile(0));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("File is empty");
  });

  it("accepts a file exactly at the 5MB boundary", () => {
    expect(validateResumeFile(fakeFile(MAX_RESUME_BYTES))).toEqual({ ok: true });
  });

  it("rejects a file just over 5MB", () => {
    const result = validateResumeFile(fakeFile(MAX_RESUME_BYTES + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("File must be under 5MB");
  });

  it("rejects null/undefined", () => {
    expect(validateResumeFile(null).ok).toBe(false);
    expect(validateResumeFile(undefined).ok).toBe(false);
  });

  it("rejects malformed input without size", () => {
    expect(validateResumeFile({ name: "x" }).ok).toBe(false);
  });
});

describe("isImageFile", () => {
  it("accepts files with image/* mime type", () => {
    expect(isImageFile({ type: "image/png" })).toBe(true);
    expect(isImageFile({ type: "image/jpeg" })).toBe(true);
    expect(isImageFile({ type: "image/gif" })).toBe(true);
    expect(isImageFile({ type: "image/webp" })).toBe(true);
  });

  it("rejects non-image mime types", () => {
    expect(isImageFile({ type: "application/pdf" })).toBe(false);
    expect(isImageFile({ type: "text/plain" })).toBe(false);
    expect(isImageFile({ type: "" })).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(isImageFile(null)).toBe(false);
    expect(isImageFile(undefined)).toBe(false);
  });

  it("rejects when type is missing", () => {
    expect(isImageFile({})).toBe(false);
  });
});
