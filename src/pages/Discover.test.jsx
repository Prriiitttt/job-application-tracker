import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Discover from "./Discover";
import { renderWithRouter, fakeSession } from "../test/test-utils";
import { supabase } from "../lib/supabase";

const ME_ID = "me-id";

const profiles = [
  { id: "alice-id", username: "alice", full_name: "Alice Wonder", avatar_url: null },
  { id: "bob-id", username: "bob", full_name: "Bob Smith", avatar_url: null },
  { id: "carol-id", username: "carol", full_name: null, avatar_url: null },
];

function setupMocks(connections = []) {
  vi.spyOn(supabase, "from").mockImplementation((table) => {
    if (table === "profiles") {
      const builder = {
        select: () => builder,
        neq: () => builder,
        order: () => Promise.resolve({ data: profiles, error: null }),
      };
      return builder;
    }
    if (table === "connections") {
      const builder = {
        select: () => builder,
        or: () => builder,
        neq: () => Promise.resolve({ data: connections, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { id: "new-conn", requester_id: ME_ID, receiver_id: "alice-id", status: "pending" },
                error: null,
              }),
          }),
        }),
      };
      return builder;
    }
    return {};
  });
}

describe("Discover page", () => {
  it("shows loading then renders the list of users", async () => {
    setupMocks();
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    expect(await screen.findByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("filters by query (case-insensitive)", async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    await user.type(screen.getByPlaceholderText(/search by name or username/i), "ALICE");
    expect(screen.getByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument();
  });

  it("hides users you are already connected with", async () => {
    setupMocks([
      { id: "c1", requester_id: ME_ID, receiver_id: "bob-id", status: "accepted" },
    ]);
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    expect(await screen.findByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument();
  });

  it("renders Connect buttons with the styled .connect-btn class", async () => {
    setupMocks();
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    const btn = await screen.findAllByRole("button", { name: /^connect$/i });
    expect(btn[0]).toHaveClass("connect-btn");
  });

  it("shows a Connect button for non-connected users and sends a request on click", async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    const connectBtns = screen.getAllByRole("button", { name: /^connect$/i });
    expect(connectBtns.length).toBeGreaterThan(0);
    await user.click(connectBtns[0]);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
    });
  });

  it("shows Pending state for outgoing pending requests", async () => {
    setupMocks([
      { id: "c1", requester_id: ME_ID, receiver_id: "alice-id", status: "pending" },
    ]);
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
  });

  it("shows Accept state for incoming pending requests", async () => {
    setupMocks([
      { id: "c1", requester_id: "alice-id", receiver_id: ME_ID, status: "pending" },
    ]);
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
  });

  it("shows empty state when no users match", async () => {
    const user = userEvent.setup();
    setupMocks();
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    await user.type(screen.getByPlaceholderText(/search by name or username/i), "zzzzz");
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it("accepts an incoming request and removes the user from the list", async () => {
    const user = userEvent.setup();
    setupMocks([
      { id: "c1", requester_id: "alice-id", receiver_id: ME_ID, status: "pending" },
    ]);
    renderWithRouter(<Discover session={fakeSession({ id: ME_ID })} />);
    await screen.findByText("Alice Wonder");
    await user.click(screen.getByRole("button", { name: /accept/i }));
    // Once accepted, Discover hides the user (Discover is for non-connected only)
    await waitFor(() => {
      expect(screen.queryByText("Alice Wonder")).not.toBeInTheDocument();
    });
  });
});
