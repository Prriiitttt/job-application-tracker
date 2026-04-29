import React, { memo, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const GifTile = memo(function GifTile({ gif, onSelect }) {
  const src =
    gif.images?.fixed_width_downsampled?.url ||
    gif.images?.fixed_width_small?.url ||
    gif.images?.fixed_width?.url;
  return (
    <button
      type="button"
      className="chat-gif-item"
      onClick={() => onSelect(gif)}
      aria-label={gif.title || "GIF"}
    >
      <img src={src} alt={gif.title || "GIF"} loading="lazy" />
    </button>
  );
});

export default function GifPicker({ onSelect, debounceMs = 300 }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!GIPHY_API_KEY) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setErrored(false);
      const q = query.trim();
      const endpoint = q
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13`;
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Giphy request failed");
        const json = await res.json();
        if (!cancelled) setGifs(json.data || []);
      } catch {
        if (!cancelled) {
          setGifs([]);
          setErrored(true);
        }
      }
      if (!cancelled) setLoading(false);
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return (
    <div className="chat-gif-popover">
      <div className="chat-gif-search">
        <input
          placeholder="Search GIFs"
          aria-label="Search GIFs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="chat-gif-results">
        {!GIPHY_API_KEY ? (
          <div className="chat-gif-state">Giphy API key not set</div>
        ) : loading ? (
          <div className="chat-gif-state" role="status" aria-label="Loading GIFs">
            <Loader2 size={18} className="spin" />
          </div>
        ) : errored ? (
          <div className="chat-gif-state">Couldn’t load GIFs</div>
        ) : gifs.length === 0 ? (
          <div className="chat-gif-state">No GIFs found</div>
        ) : (
          <div className="chat-gif-grid">
            {gifs.map((g) => (
              <GifTile key={g.id} gif={g} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
