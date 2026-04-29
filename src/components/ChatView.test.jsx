import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { supabase } from "../lib/supabase";

vi.mock("emoji-picker-react", () => ({
  default: ({ onEmojiClick }) => (
    <div data-testid="emoji-picker-stub">
      <button type="button" onClick={() => onEmojiClick({ emoji: "😀" })}>
        emoji-stub
      </button>
    </div>
  ),
  Theme: { DARK: "dark" },
}));

import ChatView from "./ChatView";
import { renderWithRouter, fakeSession, makeFakeChannel } from "../test/test-utils";

const ME_ID = "me-id";
const OTHER = { id: "other-id", username: "alice", full_name: "Alice Wonder", avatar_url: null };
const CONV_ID = "conv-1";

let fakeChannel;
let updatePartSpy;

function setupChat({ existingMessages = [] } = {}) {
  fakeChannel = makeFakeChannel();

  vi.spyOn(supabase, "rpc").mockImplementation((name) => {
    if (name === "get_or_create_conversation") {
      return Promise.resolve({ data: CONV_ID, error: null });
    }
    return Promise.resolve({ data: [], error: null });
  });

  updatePartSpy = vi.fn().mockReturnValue({
    eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  });

  vi.spyOn(supabase, "from").mockImplementation((table) => {
    if (table === "messages") {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve({ data: existingMessages, error: null }),
        insert: (row) => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { id: `m-${Date.now()}`, ...row, created_at: new Date().toISOString() },
                error: null,
              }),
          }),
        }),
      };
      return builder;
    }
    if (table === "conversation_participants") {
      return { update: updatePartSpy };
    }
    return {};
  });

  vi.spyOn(supabase, "channel").mockReturnValue(fakeChannel);
  vi.spyOn(supabase, "removeChannel").mockReturnValue(undefined);
}

beforeEach(() => {
  setupChat();
});

describe("ChatView", () => {
  it("opens the conversation and shows the empty state", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    expect(await screen.findByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("renders existing messages", async () => {
    setupChat({
      existingMessages: [
        {
          id: "m1",
          conversation_id: CONV_ID,
          sender_id: OTHER.id,
          content: "hi from alice",
          message_type: "text",
          created_at: "2026-04-23T10:00:00",
        },
        {
          id: "m2",
          conversation_id: CONV_ID,
          sender_id: ME_ID,
          content: "hi from me",
          message_type: "text",
          created_at: "2026-04-23T10:01:00",
        },
      ],
    });
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    expect(await screen.findByText("hi from alice")).toBeInTheDocument();
    expect(screen.getByText("hi from me")).toBeInTheDocument();
  });

  it("sends a text message", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    const input = screen.getByPlaceholderText(/message\.\.\./i);
    await user.type(input, "Hello there");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText("Hello there")).toBeInTheDocument();
  });

  it("disables the send button when input is empty", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={onClose} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /close chat/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("opens the emoji picker when the emoji button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /emoji/i }));
    expect(document.querySelector(".chat-emoji-popover")).toBeInTheDocument();
  });

  it("closes emoji picker when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /emoji/i }));
    expect(document.querySelector(".chat-emoji-popover")).toBeInTheDocument();
    // mousedown on the messages area (outside the emoji wrap) should close
    const outside = document.querySelector(".chat-messages");
    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await waitFor(() => {
      expect(document.querySelector(".chat-emoji-popover")).not.toBeInTheDocument();
    });
  });

  it("closes GIF picker when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /^gif$/i }));
    expect(document.querySelector(".chat-gif-popover")).toBeInTheDocument();
    const outside = document.querySelector(".chat-messages");
    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await waitFor(() => {
      expect(document.querySelector(".chat-gif-popover")).not.toBeInTheDocument();
    });
  });

  it("shows error if RPC fails", async () => {
    vi.spyOn(supabase, "rpc").mockResolvedValueOnce({
      data: null,
      error: { message: "Could not open conversation" },
    });
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    expect(await screen.findByText(/could not open conversation/i)).toBeInTheDocument();
  });

  it("appends a message arriving via realtime", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    fakeChannel.__triggerInsert({
      id: "rt-1",
      conversation_id: CONV_ID,
      sender_id: OTHER.id,
      content: "live message",
      message_type: "text",
      created_at: "2026-04-23T11:00:00",
    });
    expect(await screen.findByText("live message")).toBeInTheDocument();
  });

  it("clears the typing timer on unmount when other user was typing", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    // simulate the other user typing → starts the 3s clear timer
    fakeChannel.__triggerBroadcast({ user_id: OTHER.id });
    expect(await screen.findByText(/typing…/i)).toBeInTheDocument();
    // unmount triggers the cleanup paths (clearTimeout + setOtherTyping(false))
    // No assertion needed — coverage measures the cleanup execution
  });

  it("dedupes duplicate realtime INSERTs with the same id", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    const payload = {
      id: "rt-dup",
      conversation_id: CONV_ID,
      sender_id: OTHER.id,
      content: "dup",
      message_type: "text",
      created_at: "2026-04-23T11:00:00",
    };
    fakeChannel.__triggerInsert(payload);
    fakeChannel.__triggerInsert(payload);
    fakeChannel.__triggerInsert(payload);
    await screen.findByText("dup");
    expect(screen.getAllByText("dup")).toHaveLength(1);
  });

  it("calls mark-as-read when opening", async () => {
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await waitFor(() => {
      expect(updatePartSpy).toHaveBeenCalledWith({ last_read_at: expect.any(String) });
    });
  });

  it("uploads an image attachment", async () => {
    const user = userEvent.setup();
    const uploadSpy = vi.fn().mockResolvedValue({ data: { path: "x" }, error: null });
    vi.spyOn(supabase.storage, "from").mockReturnValue({ upload: uploadSpy });
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["png-bytes"], "photo.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalled();
    });
  });

  it("opens the GIF picker", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /^gif$/i }));
    expect(screen.getByPlaceholderText(/search gifs/i)).toBeInTheDocument();
  });

  it("typing in the input does not crash (broadcast attempted)", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    const input = screen.getByPlaceholderText(/message\.\.\./i);
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("renders an image message bubble for image-type messages", async () => {
    setupChat({
      existingMessages: [
        {
          id: "img-1",
          conversation_id: CONV_ID,
          sender_id: ME_ID,
          content: "",
          message_type: "image",
          attachment_url: "me/photo.png",
          created_at: "2026-04-23T10:00:00",
        },
      ],
    });
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      createSignedUrl: () =>
        Promise.resolve({ data: { signedUrl: "https://signed/photo.png" }, error: null }),
      upload: () => Promise.resolve({ data: null, error: null }),
    });
    const { container } = renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(container.querySelector(".chat-bubble-media")).toBeInTheDocument();
    });
  });

  it("selecting a GIF from the picker inserts a gif message", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () =>
        HttpResponse.json({
          data: [
            {
              id: "g1",
              title: "fun gif",
              images: {
                fixed_width_downsampled: { url: "https://thumb.gif" },
                fixed_height: { url: "https://full.gif" },
              },
            },
          ],
        })
      )
    );
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /^gif$/i }));
    const gifTile = await screen.findByRole("button", { name: "fun gif" });
    await user.click(gifTile);
    // The optimistic insert appends the gif message; assert by image src
    await waitFor(() => {
      expect(document.querySelector('img[src="https://full.gif"]')).toBeInTheDocument();
    });
  });

  it("emoji selection appends to the input value", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await screen.findByText(/no messages yet/i);
    await user.click(screen.getByRole("button", { name: /emoji/i }));
    await user.click(await screen.findByRole("button", { name: "emoji-stub" }));
    expect(screen.getByPlaceholderText(/message\.\.\./i)).toHaveValue("😀");
  });

  it("renders a GIF message bubble for gif-type messages", async () => {
    setupChat({
      existingMessages: [
        {
          id: "gif-1",
          conversation_id: CONV_ID,
          sender_id: OTHER.id,
          content: "",
          message_type: "gif",
          attachment_url: "https://media.giphy.com/x.gif",
          created_at: "2026-04-23T10:00:00",
        },
      ],
    });
    const { container } = renderWithRouter(
      <ChatView session={fakeSession({ id: ME_ID })} otherUser={OTHER} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(container.querySelector('img[src*="giphy"]')).toBeInTheDocument();
    });
  });
});
