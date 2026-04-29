import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AttachmentImage, { __resetAttachmentCache } from "./AttachmentImage";
import { supabase } from "../lib/supabase";

beforeEach(() => {
  __resetAttachmentCache();
});

function mockSignedUrl(result) {
  vi.spyOn(supabase.storage, "from").mockReturnValue({
    createSignedUrl: () => Promise.resolve(result),
  });
}

describe("AttachmentImage", () => {
  it("shows a loading spinner before the URL resolves", () => {
    let resolve;
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      createSignedUrl: () => new Promise((r) => { resolve = r; }),
    });
    render(<AttachmentImage path="me/abc.png" />);
    expect(screen.getByLabelText(/loading attachment/i)).toBeInTheDocument();
    resolve({ data: { signedUrl: "https://signed/abc.png" }, error: null });
  });

  it("renders the signed URL once fetched", async () => {
    mockSignedUrl({ data: { signedUrl: "https://signed/abc.png" }, error: null });
    const { container } = render(<AttachmentImage path="me/abc.png" />);
    await waitFor(() => {
      expect(container.querySelector("img.chat-image")).toBeInTheDocument();
    });
    expect(container.querySelector("img.chat-image")).toHaveAttribute(
      "src",
      "https://signed/abc.png"
    );
  });

  it("shows fallback when the signed URL request errors", async () => {
    mockSignedUrl({ data: null, error: { message: "denied" } });
    render(<AttachmentImage path="me/abc.png" />);
    expect(await screen.findByLabelText(/attachment unavailable/i)).toBeInTheDocument();
  });

  it("shows fallback when the storage call rejects", async () => {
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      createSignedUrl: () => Promise.reject(new Error("network")),
    });
    render(<AttachmentImage path="me/abc.png" />);
    expect(await screen.findByLabelText(/attachment unavailable/i)).toBeInTheDocument();
  });

  it("reuses the cached signed URL for the same path", async () => {
    const calls = [];
    vi.spyOn(supabase.storage, "from").mockImplementation(() => ({
      createSignedUrl: (path) => {
        calls.push(path);
        return Promise.resolve({ data: { signedUrl: `https://signed/${path}` }, error: null });
      },
    }));
    const { unmount, container } = render(<AttachmentImage path="me/cached.png" />);
    await waitFor(() => {
      expect(container.querySelector("img.chat-image")).toBeInTheDocument();
    });
    unmount();
    render(<AttachmentImage path="me/cached.png" />);
    expect(calls).toEqual(["me/cached.png"]);
  });

  it("re-fetches when the path prop changes", async () => {
    const calls = [];
    vi.spyOn(supabase.storage, "from").mockImplementation(() => ({
      createSignedUrl: (path) => {
        calls.push(path);
        return Promise.resolve({ data: { signedUrl: `https://signed/${path}` }, error: null });
      },
    }));
    const { rerender, container } = render(<AttachmentImage path="me/abc.png" />);
    await waitFor(() => {
      expect(container.querySelector("img.chat-image")).toBeInTheDocument();
    });
    rerender(<AttachmentImage path="me/xyz.png" />);
    await waitFor(() => {
      expect(calls).toContain("me/abc.png");
      expect(calls).toContain("me/xyz.png");
    });
  });
});
