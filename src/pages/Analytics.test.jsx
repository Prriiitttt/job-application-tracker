import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Analytics from "./Analytics";
import { fakeSession } from "../test/test-utils";
import { supabase } from "../lib/supabase";

// Recharts ResponsiveContainer needs a measurable parent — stub it.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

beforeEach(() => {
  vi.spyOn(supabase, "from").mockImplementation(() => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      single: () => Promise.resolve({ data: { weekly_goal: 5 }, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    };
    return builder;
  });
});

describe("Analytics page", () => {
  it("shows empty state when no applications", async () => {
    const { container } = render(<Analytics applications={[]} session={fakeSession()} />);
    expect(screen.getByRole("heading", { name: /no data yet/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /applications per week/i })).not.toBeInTheDocument();
  });

  it("renders all charts and the weekly goal when there are applications", async () => {
    render(
      <Analytics
        applications={[
          { id: 1, status: "applied", data: "2026-04-20" },
          { id: 2, status: "interview", data: "2026-04-21" },
        ]}
        session={fakeSession()}
      />
    );
    expect(screen.getByRole("heading", { name: /applications per week/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /status breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /application streak/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /weekly goal/i })).toBeInTheDocument();
  });

  it("loads the saved weekly goal", async () => {
    render(<Analytics applications={[{ id: 1, status: "applied", data: "2026-04-20" }]} session={fakeSession()} />);
    await waitFor(() => {
      expect(screen.getByRole("spinbutton")).toHaveValue(5);
    });
  });

  it("updates the weekly goal on input", async () => {
    const user = userEvent.setup();
    render(<Analytics applications={[{ id: 1, status: "applied", data: "2026-04-20" }]} session={fakeSession()} />);
    const goalInput = await screen.findByRole("spinbutton");
    await user.clear(goalInput);
    await user.type(goalInput, "10");
    expect(goalInput).toHaveValue(10);
  });
});

