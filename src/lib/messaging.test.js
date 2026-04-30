import { describe, it, expect } from "vitest";
import {
  buildUnreadMap,
  hasAnyUnread,
  sanitizeFilename,
  formatMessageTime,
} from "./messaging";

describe("buildUnreadMap", () => {
  it("builds a map keyed by other_user_id", () => {
    const rows = [
      { conversation_id: "c1", other_user_id: "u1", has_unread: true },
      { conversation_id: "c2", other_user_id: "u2", has_unread: false },
    ];
    expect(buildUnreadMap(rows)).toEqual({ u1: true, u2: false });
  });

  it("ORs has_unread when the same user appears in multiple rows", () => {
    const rows = [
      { conversation_id: "c1", other_user_id: "u1", has_unread: true },
      { conversation_id: "c2", other_user_id: "u1", has_unread: false },
    ];
    expect(buildUnreadMap(rows)).toEqual({ u1: true });
  });

  it("ORs in any order — false-then-true also yields true", () => {
    const rows = [
      { conversation_id: "c1", other_user_id: "u1", has_unread: false },
      { conversation_id: "c2", other_user_id: "u1", has_unread: true },
    ];
    expect(buildUnreadMap(rows)).toEqual({ u1: true });
  });

  it("returns empty map for empty array", () => {
    expect(buildUnreadMap([])).toEqual({});
  });

  it("returns empty map for non-array input", () => {
    expect(buildUnreadMap(null)).toEqual({});
    expect(buildUnreadMap(undefined)).toEqual({});
    expect(buildUnreadMap("nope")).toEqual({});
  });

  it("ignores rows missing other_user_id", () => {
    const rows = [
      { has_unread: true },
      { other_user_id: "u1", has_unread: true },
    ];
    expect(buildUnreadMap(rows)).toEqual({ u1: true });
  });

  it("coerces truthy/falsy values to booleans", () => {
    const rows = [
      { other_user_id: "u1", has_unread: 1 },
      { other_user_id: "u2", has_unread: 0 },
      { other_user_id: "u3", has_unread: null },
    ];
    expect(buildUnreadMap(rows)).toEqual({ u1: true, u2: false, u3: false });
  });
});

describe("hasAnyUnread", () => {
  it("returns true when any value is truthy", () => {
    expect(hasAnyUnread({ a: false, b: true })).toBe(true);
  });

  it("returns false when all values are falsy", () => {
    expect(hasAnyUnread({ a: false, b: false })).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(hasAnyUnread({})).toBe(false);
  });

  it("returns false for null/undefined/non-object", () => {
    expect(hasAnyUnread(null)).toBe(false);
    expect(hasAnyUnread(undefined)).toBe(false);
    expect(hasAnyUnread("nope")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("preserves alphanumeric, dash, underscore, and dot", () => {
    expect(sanitizeFilename("my-file_v2.jpg")).toBe("my-file_v2.jpg");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("hello world.png")).toBe("hello_world.png");
  });

  it("replaces unicode characters with underscores", () => {
    expect(sanitizeFilename("résumé.pdf")).toBe("r_sum_.pdf");
  });

  it("replaces emoji with underscores", () => {
    expect(sanitizeFilename("🚀rocket.png")).toBe("__rocket.png");
  });

  it("returns 'file' for empty string", () => {
    expect(sanitizeFilename("")).toBe("file");
  });

  it("returns 'file' for non-string input", () => {
    expect(sanitizeFilename(null)).toBe("file");
    expect(sanitizeFilename(undefined)).toBe("file");
    expect(sanitizeFilename(42)).toBe("file");
  });

  it("preserves a long filename intact when chars are safe", () => {
    const long = "a".repeat(200) + ".png";
    expect(sanitizeFilename(long)).toBe(long);
  });
});

describe("formatMessageTime", () => {
  it("returns 'just now' for messages less than a minute old", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatMessageTime(iso, now)).toBe("just now");
  });

  it("returns 'just now' for a message dated exactly now", () => {
    const now = new Date("2026-04-23T18:00:00");
    expect(formatMessageTime(now.toISOString(), now)).toBe("just now");
  });

  it("returns '1 minute ago' (singular) for ~1 minute old", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(formatMessageTime(iso, now)).toBe("1 minute ago");
  });

  it("returns 'X minutes ago' (plural) for ~5 minutes old", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatMessageTime(iso, now)).toBe("5 minutes ago");
  });

  it("returns 'X minutes ago' for ~59 minutes old (boundary)", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatMessageTime(iso, now)).toBe("59 minutes ago");
  });

  it("falls through to absolute time when ≥ 1 hour ago, same day", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() - 61 * 60 * 1000).toISOString();
    const out = formatMessageTime(iso, now);
    expect(out).not.toMatch(/ago|just now/);
    expect(out).not.toMatch(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns 'Yesterday HH:MM' for a message from the previous day", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date("2026-04-22T09:30:00").toISOString();
    expect(formatMessageTime(iso, now)).toMatch(/^Yesterday /);
  });

  it("includes a month abbreviation for older messages", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date("2026-03-15T09:30:00").toISOString();
    const out = formatMessageTime(iso, now);
    expect(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(out)).toBe(true);
  });

  it("does not apply relative phrasing to future timestamps", () => {
    const now = new Date("2026-04-23T18:00:00");
    const iso = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const out = formatMessageTime(iso, now);
    expect(out).not.toMatch(/ago|just now/);
  });

  it("returns empty string for null/undefined/empty input", () => {
    expect(formatMessageTime(null)).toBe("");
    expect(formatMessageTime(undefined)).toBe("");
    expect(formatMessageTime("")).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatMessageTime("not-a-date")).toBe("");
  });
});
