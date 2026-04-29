import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getStoredViewMode, setStoredViewMode } from "./storage";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getStoredViewMode", () => {
  it("returns the default 'list' when nothing is stored", () => {
    expect(getStoredViewMode()).toBe("list");
  });

  it("returns the custom default when nothing is stored", () => {
    expect(getStoredViewMode("kanban")).toBe("kanban");
  });

  it("returns the stored value when valid", () => {
    window.localStorage.setItem("appliedViewMode", "kanban");
    expect(getStoredViewMode()).toBe("kanban");
  });

  it("returns default for invalid stored value", () => {
    window.localStorage.setItem("appliedViewMode", "garbage");
    expect(getStoredViewMode()).toBe("list");
  });

  it("returns default for empty string stored value", () => {
    window.localStorage.setItem("appliedViewMode", "");
    expect(getStoredViewMode()).toBe("list");
  });
});

describe("setStoredViewMode", () => {
  it("writes a valid mode to localStorage", () => {
    setStoredViewMode("kanban");
    expect(window.localStorage.getItem("appliedViewMode")).toBe("kanban");
  });

  it("ignores invalid mode silently", () => {
    setStoredViewMode("garbage");
    expect(window.localStorage.getItem("appliedViewMode")).toBeNull();
  });

  it("ignores null/undefined silently", () => {
    setStoredViewMode(null);
    setStoredViewMode(undefined);
    expect(window.localStorage.getItem("appliedViewMode")).toBeNull();
  });

  it("round-trips list/kanban", () => {
    setStoredViewMode("list");
    expect(getStoredViewMode()).toBe("list");
    setStoredViewMode("kanban");
    expect(getStoredViewMode()).toBe("kanban");
  });

  it("does not throw when getItem throws (defensive read)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(getStoredViewMode("kanban")).toBe("kanban");
  });

  it("does not throw when setItem throws (quota exceeded)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => setStoredViewMode("list")).not.toThrow();
  });
});
