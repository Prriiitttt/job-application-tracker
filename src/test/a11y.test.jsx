import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import Home from "../pages/Home";
import Error from "../pages/Error";
import Login from "../pages/Login";
import Applied from "../pages/Applied";
import Analytics from "../pages/Analytics";
import Discover from "../pages/Discover";
import Profile from "../pages/Profile";
import Connections from "../pages/Connections";
import ChatView from "../components/ChatView";
import Layout from "../components/Layout";

import { renderWithRouter, fakeSession, makeFakeChannel } from "./test-utils";
import { supabase } from "../lib/supabase";

expect.extend(toHaveNoViolations);

vi.mock("emoji-picker-react", () => ({
  default: () => <div data-testid="emoji-picker-stub" />,
  Theme: { DARK: "dark" },
}));

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

const ME_ID = "me-id";

function setupSupabaseMocks() {
  vi.spyOn(supabase, "rpc").mockResolvedValue({
    data: [{ total: 4, applied: 2, interview: 1, rejected: 1 }],
    error: null,
  });
  vi.spyOn(supabase, "channel").mockReturnValue(makeFakeChannel());
  vi.spyOn(supabase, "removeChannel").mockReturnValue(undefined);
  vi.spyOn(supabase.storage, "from").mockReturnValue({
    upload: () => Promise.resolve({ data: null, error: null }),
    createSignedUrl: () => Promise.resolve({ data: { signedUrl: "blob:mock" }, error: null }),
    remove: () => Promise.resolve({ data: null, error: null }),
  });
  vi.spyOn(supabase, "from").mockImplementation((table) => {
    if (table === "profiles") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => Promise.resolve({ data: [], error: null }),
        neq: () => builder,
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({
          data: { id: ME_ID, username: "me", full_name: "Me Myself", bio: "hello", avatar_url: null },
          error: null,
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      };
      return builder;
    }
    if (table === "connections") {
      const builder = {
        select: () => builder,
        or: () => builder,
        eq: () => Promise.resolve({ data: [], error: null }),
        neq: () => Promise.resolve({ data: [], error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      };
      return builder;
    }
    if (table === "messages") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve({ data: [], error: null }),
      };
      return builder;
    }
    if (table === "user_settings") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      };
      return builder;
    }
    if (table === "conversation_participants") {
      return {
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    }
    return {};
  });
  vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValue({ data: {}, error: null });
  vi.spyOn(supabase.auth, "signUp").mockResolvedValue({ data: {}, error: null });
  vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValue({ data: {}, error: null });
}

beforeEach(() => {
  setupSupabaseMocks();
});

async function expectNoA11yViolations(container) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("a11y — pages and components", () => {
  it("Home has no axe violations", async () => {
    const { container } = render(<Home applications={[
      { id: 1, status: "applied" }, { id: 2, status: "interview" },
    ]} />);
    await expectNoA11yViolations(container);
  });

  it("Error page has no axe violations", async () => {
    const { container } = renderWithRouter(<Error />);
    await expectNoA11yViolations(container);
  });

  it("Login has no axe violations", async () => {
    const { container } = render(<Login />);
    await expectNoA11yViolations(container);
  });

  it("Applied (with data) has no axe violations", async () => {
    const apps = [
      { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "" },
    ];
    const { container } = render(
      <Applied
        applications={apps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await expectNoA11yViolations(container);
  });

  it("Applied (empty state) has no axe violations", async () => {
    const { container } = render(
      <Applied
        applications={[]}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await expectNoA11yViolations(container);
  });

  it("Analytics (with data) has no axe violations", async () => {
    const { container } = render(
      <Analytics
        applications={[{ id: 1, status: "applied", data: "2026-04-20" }]}
        session={fakeSession()}
      />
    );
    await expectNoA11yViolations(container);
  });

  it("Discover has no axe violations", async () => {
    const { container } = renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByPlaceholderText(/search by name or username/i);
    await expectNoA11yViolations(container);
  });

  it("Profile (own) has no axe violations", async () => {
    const { container } = renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn />);
    await screen.findByRole("heading", { name: /my profile/i });
    await expectNoA11yViolations(container);
  });

  it("Connections (empty state) has no axe violations", async () => {
    const { container } = renderWithRouter(
      <Connections session={fakeSession({ id: ME_ID })} unreadMap={{}} onMarkedRead={() => {}} />
    );
    await screen.findByText(/no connections yet/i);
    await expectNoA11yViolations(container);
  });

  it("ChatView has no axe violations", async () => {
    const otherUser = { id: "other-id", username: "alice", full_name: "Alice", avatar_url: null };
    vi.spyOn(supabase, "rpc").mockResolvedValue({ data: "conv-1", error: null });
    const { container } = renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={otherUser} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await expectNoA11yViolations(container);
  });

  it("Layout has no axe violations", async () => {
    const { container } = renderWithRouter(
      <Layout session={fakeSession()} onSignOut={() => {}} hasUnreadMessages={true} />
    );
    await expectNoA11yViolations(container);
  });
});
