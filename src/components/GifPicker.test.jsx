import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import GifPicker from "./GifPicker";

function gifFixture(id, url) {
  return {
    id,
    title: `gif-${id}`,
    images: {
      fixed_width_downsampled: { url },
      fixed_width_small: { url },
      fixed_width: { url },
      fixed_height: { url: `${url}#full` },
    },
  };
}

describe("GifPicker", () => {
  it("loads trending results on first render", async () => {
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () =>
        HttpResponse.json({
          data: [gifFixture("1", "https://m.giphy.com/a.gif"), gifFixture("2", "https://m.giphy.com/b.gif")],
        })
      )
    );
    render(<GifPicker onSelect={() => {}} debounceMs={0} />);
    expect(await screen.findByRole("button", { name: "gif-1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "gif-2" })).toBeInTheDocument();
  });

  it("debounces and calls the search endpoint when user types", async () => {
    const trendingHits = vi.fn();
    const searchHits = vi.fn();
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () => {
        trendingHits();
        return HttpResponse.json({ data: [] });
      }),
      http.get("https://api.giphy.com/v1/gifs/search", () => {
        searchHits();
        return HttpResponse.json({
          data: [gifFixture("s1", "https://m.giphy.com/cat.gif")],
        });
      })
    );
    const user = userEvent.setup();
    render(<GifPicker onSelect={() => {}} debounceMs={0} />);
    await waitFor(() => expect(trendingHits).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/search gifs/i), "cat");
    expect(await screen.findByRole("button", { name: "gif-s1" })).toBeInTheDocument();
    expect(searchHits).toHaveBeenCalled();
  });

  it("calls onSelect with the gif when a tile is clicked", async () => {
    const onSelect = vi.fn();
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () =>
        HttpResponse.json({ data: [gifFixture("clicked", "https://m.giphy.com/x.gif")] })
      )
    );
    const user = userEvent.setup();
    render(<GifPicker onSelect={onSelect} debounceMs={0} />);
    await user.click(await screen.findByRole("button", { name: "gif-clicked" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "clicked" })
    );
  });

  it("shows the empty state when the API returns no results", async () => {
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () => HttpResponse.json({ data: [] }))
    );
    render(<GifPicker onSelect={() => {}} debounceMs={0} />);
    expect(await screen.findByText(/no gifs found/i)).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () =>
        new HttpResponse(null, { status: 500 })
      )
    );
    render(<GifPicker onSelect={() => {}} debounceMs={0} />);
    expect(await screen.findByText(/couldn’t load gifs/i)).toBeInTheDocument();
  });

  it("falls back to fixed_width_small / fixed_width URLs if downsampled is missing", async () => {
    const gif = {
      id: "fb",
      title: "fallback",
      images: { fixed_width_small: { url: "https://small.gif" } },
    };
    server.use(
      http.get("https://api.giphy.com/v1/gifs/trending", () => HttpResponse.json({ data: [gif] }))
    );
    render(<GifPicker onSelect={() => {}} debounceMs={0} />);
    const tile = await screen.findByRole("button", { name: "fallback" });
    const img = tile.querySelector("img");
    expect(img).toHaveAttribute("src", "https://small.gif");
  });
});
