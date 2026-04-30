import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // matches the 3600s expiry requested below
const SIGNED_URL_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refetch ~5 min before expiry
const signedUrlCache = new Map(); // path -> { url, expiresAt }

export function __resetAttachmentCache() {
  signedUrlCache.clear();
}

function getCached(path) {
  const entry = signedUrlCache.get(path);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    signedUrlCache.delete(path);
    return null;
  }
  return entry.url;
}

export default function AttachmentImage({ path }) {
  const cached = getCached(path);
  const [url, setUrl] = useState(cached);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const hit = getCached(path);
    if (hit) {
      setUrl(hit);
      setErrored(false);
      return;
    }
    let cancelled = false;
    setUrl(null);
    setErrored(false);
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setErrored(true);
          return;
        }
        signedUrlCache.set(path, {
          url: data.signedUrl,
          // Treat as expired 5 min before the server TTL so callers refetch
          // before the URL actually goes stale.
          expiresAt: Date.now() + SIGNED_URL_TTL_MS - SIGNED_URL_REFRESH_BUFFER_MS,
        });
        setUrl(data.signedUrl);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (errored) {
    return (
      <div className="chat-image-loading" role="img" aria-label="Attachment unavailable">
        unavailable
      </div>
    );
  }

  if (!url) {
    return (
      <div className="chat-image-loading" role="status" aria-label="Loading attachment">
        <Loader2 size={18} className="spin" />
      </div>
    );
  }

  return <img src={url} alt="" className="chat-image" />;
}
