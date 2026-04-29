import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "./Profile";
import { renderWithRouter, fakeSession } from "../test/test-utils";
import { supabase } from "../lib/supabase";

const ME_ID = "me-id";
const OTHER_ID = "other-id";

function mockProfileFetch(profile) {
  vi.spyOn(supabase, "from").mockImplementation((table) => {
    if (table === "profiles") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        single: () => Promise.resolve({ data: profile, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      };
      return builder;
    }
    if (table === "connections") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        or: () => builder,
        neq: () => builder,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { id: "conn-new", requester_id: ME_ID, receiver_id: OTHER_ID, status: "pending" },
              error: null,
            }),
          }),
        }),
      };
      return builder;
    }
    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
  });

  vi.spyOn(supabase, "rpc").mockResolvedValue({
    data: [{ total: 4, applied: 2, interview: 1, rejected: 1 }],
    error: null,
  });
}

describe("Profile (own profile)", () => {
  beforeEach(() => {
    mockProfileFetch({
      id: ME_ID,
      username: "me",
      full_name: "Me Myself",
      bio: "Hi I'm me",
      avatar_url: null,
    });
  });

  it("shows my profile heading and editable fields", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn />);
    expect(await screen.findByRole("heading", { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Me Myself")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hi I'm me")).toBeInTheDocument();
  });

  it("renders my application stats", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn />);
    await screen.findByText(/total/i);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("saves edits to full_name and bio", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn />);
    const nameInput = await screen.findByDisplayValue("Me Myself");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("profiles");
    });
  });
});

describe("Profile (other user, not connected)", () => {
  beforeEach(() => {
    mockProfileFetch({
      id: OTHER_ID,
      username: "other",
      full_name: "Other User",
      bio: "",
      avatar_url: null,
    });
  });

  it("shows the Connect button", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    expect(await screen.findByRole("button", { name: /connect/i })).toBeInTheDocument();
  });

  it("sends a connect request when the Connect button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    await user.click(await screen.findByRole("button", { name: /connect/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
    });
  });

  it("hides stats and shows the privacy notice", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    expect(
      await screen.findByText(/Connect with .* to see their application stats/i)
    ).toBeInTheDocument();
  });

  it("does not show the edit form on someone else's profile", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    await screen.findByRole("heading", { name: "Other User" });
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});

describe("Profile (other user, accepted connection)", () => {
  beforeEach(() => {
    vi.spyOn(supabase, "from").mockImplementation((table) => {
      if (table === "profiles") {
        const builder = {
          select: () => builder,
          eq: () => builder,
          single: () => Promise.resolve({
            data: { id: OTHER_ID, username: "other", full_name: "Other User", bio: "", avatar_url: null },
            error: null,
          }),
        };
        return builder;
      }
      if (table === "connections") {
        const builder = {
          select: () => builder,
          or: () => builder,
          neq: () => builder,
          maybeSingle: () => Promise.resolve({
            data: { id: "c1", requester_id: ME_ID, receiver_id: OTHER_ID, status: "accepted" },
            error: null,
          }),
        };
        return builder;
      }
      return {};
    });
    vi.spyOn(supabase, "rpc").mockResolvedValue({
      data: [{ total: 5, applied: 3, interview: 1, rejected: 1 }],
      error: null,
    });
  });

  it("shows Connected and Message buttons, plus stats", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    expect(await screen.findByRole("button", { name: /connected/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /message/i })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

describe("Profile (other user, outgoing pending request)", () => {
  beforeEach(() => {
    vi.spyOn(supabase, "from").mockImplementation((table) => {
      if (table === "profiles") {
        const builder = {
          select: () => builder,
          eq: () => builder,
          single: () => Promise.resolve({
            data: { id: OTHER_ID, username: "other", full_name: "Other User", bio: "", avatar_url: null },
            error: null,
          }),
        };
        return builder;
      }
      if (table === "connections") {
        const builder = {
          select: () => builder,
          or: () => builder,
          neq: () => builder,
          maybeSingle: () => Promise.resolve({
            data: { id: "c1", requester_id: ME_ID, receiver_id: OTHER_ID, status: "pending" },
            error: null,
          }),
        };
        return builder;
      }
      return {};
    });
    vi.spyOn(supabase, "rpc").mockResolvedValue({ data: null, error: null });
  });

  it("shows the Pending disabled button", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    const btn = await screen.findByRole("button", { name: /pending/i });
    expect(btn).toBeDisabled();
  });
});

describe("Profile (other user, incoming pending request)", () => {
  beforeEach(() => {
    vi.spyOn(supabase, "from").mockImplementation((table) => {
      if (table === "profiles") {
        const builder = {
          select: () => builder,
          eq: () => builder,
          single: () => Promise.resolve({
            data: { id: OTHER_ID, username: "other", full_name: "Other User", bio: "", avatar_url: null },
            error: null,
          }),
        };
        return builder;
      }
      if (table === "connections") {
        const builder = {
          select: () => builder,
          or: () => builder,
          neq: () => builder,
          maybeSingle: () => Promise.resolve({
            data: { id: "c1", requester_id: OTHER_ID, receiver_id: ME_ID, status: "pending" },
            error: null,
          }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        };
        return builder;
      }
      return {};
    });
    vi.spyOn(supabase, "rpc").mockResolvedValue({ data: null, error: null });
  });

  it("shows Accept and Decline buttons", async () => {
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    expect(await screen.findByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("can accept a pending request", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    await user.click(await screen.findByRole("button", { name: /accept/i }));
    expect(await screen.findByRole("button", { name: /connected/i })).toBeInTheDocument();
  });

  it("can decline a pending request", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    await user.click(await screen.findByRole("button", { name: /decline/i }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /connect/i })).toBeInTheDocument();
    });
  });
});

describe("Profile not found", () => {
  it("shows User not found if profile is null", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    });
    renderWithRouter(<Profile session={fakeSession({ id: ME_ID })} isOwn={false} />);
    expect(await screen.findByRole("heading", { name: /user not found/i })).toBeInTheDocument();
  });
});
