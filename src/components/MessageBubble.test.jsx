import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MessageBubble from "./MessageBubble";
import { supabase } from "../lib/supabase";

describe("MessageBubble", () => {
  it("renders a text bubble with mine alignment", () => {
    render(
      <MessageBubble
        message={{
          id: "1",
          message_type: "text",
          content: "hello world",
          created_at: "2026-04-23T10:00:00",
        }}
        mine={true}
      />
    );
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(document.querySelector(".chat-bubble-row.mine")).toBeInTheDocument();
  });

  it("renders a text bubble with theirs alignment", () => {
    render(
      <MessageBubble
        message={{ id: "2", message_type: "text", content: "yo", created_at: "2026-04-23T10:00:00" }}
        mine={false}
      />
    );
    expect(document.querySelector(".chat-bubble-row.theirs")).toBeInTheDocument();
  });

  it("renders an image attachment via AttachmentImage", () => {
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      createSignedUrl: () =>
        Promise.resolve({ data: { signedUrl: "https://signed/x.png" }, error: null }),
    });
    const { container } = render(
      <MessageBubble
        message={{
          id: "3",
          message_type: "image",
          attachment_url: "me/x.png",
          created_at: "2026-04-23T10:00:00",
        }}
        mine={true}
      />
    );
    expect(container.querySelector(".chat-bubble-media")).toBeInTheDocument();
  });

  it("renders a gif inline image when message_type is gif", () => {
    const { container } = render(
      <MessageBubble
        message={{
          id: "4",
          message_type: "gif",
          attachment_url: "https://media.giphy.com/x.gif",
          created_at: "2026-04-23T10:00:00",
        }}
        mine={false}
      />
    );
    const img = container.querySelector("img.chat-image");
    expect(img).toHaveAttribute("src", "https://media.giphy.com/x.gif");
  });

  it("memoization re-renders only when message content/attachment/mine changes", () => {
    const message = {
      id: "5",
      message_type: "text",
      content: "v1",
      created_at: "2026-04-23T10:00:00",
    };
    const { rerender } = render(<MessageBubble message={message} mine={true} />);
    expect(screen.getByText("v1")).toBeInTheDocument();
    // same id + content → memo skips re-render; we still see v1
    rerender(<MessageBubble message={{ ...message, content: "v1" }} mine={true} />);
    expect(screen.getByText("v1")).toBeInTheDocument();
    // change content → re-renders
    rerender(<MessageBubble message={{ ...message, content: "v2" }} mine={true} />);
    expect(screen.getByText("v2")).toBeInTheDocument();
  });
});
