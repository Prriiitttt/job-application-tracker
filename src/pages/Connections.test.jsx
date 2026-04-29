import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Connections from "./Connections";
import { renderWithRouter, fakeSession, makeFakeChannel } from "../test/test-utils";
import { supabase } from "../lib/supabase";

const ME_ID = "me-id";

function setupConnections(connectionRows = [], profileRows = []) {
  vi.spyOn(supabase, "from").mockImplementation((table) => {
    if (table === "connections") {
      const builder = {
        select: () => builder,
        or: () => builder,
        eq: () => Promise.resolve({ data: connectionRows, error: null }),
      };
      return builder;
    }
    if (table === "profiles") {
      const builder = {
        select: () => builder,
        in: () => Promise.resolve({ data: profileRows, error: null }),
      };
      return builder;
    }
    if (table === "conversation_participants") {
      return {
        update: () => ({
          eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        }),
      };
    }
    if (table === "messages") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve({ data: [], error: null }),
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { id: "m1", sender_id: ME_ID, content: "hi", message_type: "text" },
                error: null,
              }),
          }),
        }),
      };
      return builder;
    }
    return {};
  });
  vi.spyOn(supabase, "rpc").mockResolvedValue({ data: [], error: null });
  vi.spyOn(supabase, "channel").mockReturnValue(makeFakeChannel());
  vi.spyOn(supabase, "removeChannel").mockReturnValue(undefined);
}

describe("Connections page", () => {
  beforeEach(() => {
    setupConnections();
  });

  it("shows empty state when no connections", async () => {
    renderWithRouter(<Connections session={fakeSession({ id: ME_ID })} unreadMap={{}} onMarkedRead={() => {}} />);
    expect(await screen.findByText(/no connections yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discover people/i })).toBeInTheDocument();
  });

  it("shows accepted connections", async () => {
    setupConnections(
      [{ id: "c1", requester_id: ME_ID, receiver_id: "alice-id", status: "accepted" }],
      [{ id: "alice-id", username: "alice", full_name: "Alice Wonder", avatar_url: null }]
    );
    renderWithRouter(<Connections session={fakeSession({ id: ME_ID })} unreadMap={{}} onMarkedRead={() => {}} />);
    expect(await screen.findByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
  });

  it("highlights conversations with unread messages", async () => {
    setupConnections(
      [{ id: "c1", requester_id: ME_ID, receiver_id: "alice-id", status: "accepted" }],
      [{ id: "alice-id", username: "alice", full_name: "Alice Wonder", avatar_url: null }]
    );
    renderWithRouter(
      <Connections
        session={fakeSession({ id: ME_ID })}
        unreadMap={{ "alice-id": true }}
        onMarkedRead={() => {}}
      />
    );
    await screen.findByText("Alice Wonder");
    expect(document.querySelector(".connection-card.has-unread")).toBeInTheDocument();
    expect(screen.getByLabelText(/unread messages/i)).toBeInTheDocument();
  });

  it("auto-opens the chat panel when navigated with state.openChatWith", async () => {
    setupConnections(
      [{ id: "c1", requester_id: ME_ID, receiver_id: "alice-id", status: "accepted" }],
      [{ id: "alice-id", username: "alice", full_name: "Alice Wonder", avatar_url: null }]
    );
    // Set up a router with state on the initial entry
    const { MemoryRouter, Routes, Route } = await import("react-router-dom");
    const { render } = await import("@testing-library/react");
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/connections", state: { openChatWith: "alice-id" } }]}
      >
        <Routes>
          <Route
            path="/connections"
            element={
              <Connections
                session={fakeSession({ id: ME_ID })}
                unreadMap={{}}
                onMarkedRead={() => {}}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByPlaceholderText(/message\.\.\./i)).toBeInTheDocument();
  });

  it("opens the chat panel when Message is clicked", async () => {
    const user = userEvent.setup();
    setupConnections(
      [{ id: "c1", requester_id: ME_ID, receiver_id: "alice-id", status: "accepted" }],
      [{ id: "alice-id", username: "alice", full_name: "Alice Wonder", avatar_url: null }]
    );
    renderWithRouter(
      <Connections session={fakeSession({ id: ME_ID })} unreadMap={{}} onMarkedRead={() => {}} />
    );
    await screen.findByText("Alice Wonder");
    await user.click(screen.getByRole("button", { name: /message Alice Wonder/i }));
    // Chat header opens with an aria-label "Back" or composer placeholder
    expect(await screen.findByPlaceholderText(/message\.\.\./i)).toBeInTheDocument();
  });
});
