import React, { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Send, Smile, Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { sanitizeFilename, formatMessageTime } from "../lib/messaging";
import { validateChatImage } from "../lib/validation";
import AttachmentImage from "./AttachmentImage";
import Avatar from "./Avatar";
import GifPicker from "./GifPicker";
import MessageBubble from "./MessageBubble";
import "./ChatView.css";

export default function ChatView({ session, otherUser, onClose, onMarkedRead }) {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiWrapRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const gifWrapRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingBroadcastTsRef = useRef(0);
  const typingClearTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function openConversation() {
      setLoading(true);
      setError(null);
      const { data: convId, error: rpcErr } = await supabase.rpc(
        "get_or_create_conversation",
        { other_user_id: otherUser.id }
      );
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr.message || "Could not open conversation");
        setLoading(false);
        return;
      }
      setConversationId(convId);
      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (msgErr) {
        setError(msgErr.message || "Could not load messages");
      } else {
        setMessages(msgs || []);
      }
      setLoading(false);
      markConversationRead(convId);
    }
    openConversation();
    return () => { cancelled = true; };
  }, [otherUser.id]);

  async function markConversationRead(convId) {
    if (!convId) return;
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .eq("user_id", session.user.id);
    onMarkedRead?.(otherUser.id);
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages.length, loading]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_id !== session.user.id) {
            markConversationRead(payload.new.conversation_id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.user_id === session.user.id) return;
        setOtherTyping(true);
        if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
        typingClearTimerRef.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      if (typingClearTimerRef.current) {
        clearTimeout(typingClearTimerRef.current);
        typingClearTimerRef.current = null;
      }
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      setOtherTyping(false);
    };
  }, [conversationId, session.user.id]);

  function broadcastTyping() {
    if (!typingChannelRef.current) return;
    const now = Date.now();
    if (now - typingBroadcastTsRef.current < 2000) return;
    typingBroadcastTsRef.current = now;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: session.user.id },
    });
  }

  useEffect(() => {
    if (!showEmojiPicker) return;
    function onDocMouseDown(e) {
      if (emojiWrapRef.current && !emojiWrapRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showEmojiPicker]);

  function handleEmojiSelect(emojiData) {
    setInputValue((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (!showGifPicker) return;
    function onDocMouseDown(e) {
      if (gifWrapRef.current && !gifWrapRef.current.contains(e.target)) {
        setShowGifPicker(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showGifPicker]);

  async function handleSelectGif(gif) {
    if (!conversationId) return;
    setShowGifPicker(false);
    const url = gif.images?.fixed_height?.url;
    if (!url) return;
    const { data, error: insertErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: "",
        message_type: "gif",
        attachment_url: url,
      })
      .select()
      .single();
    if (!insertErr && data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || !conversationId || sending) return;
    setSending(true);
    const { data, error: sendErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content,
        message_type: "text",
      })
      .select()
      .single();
    if (!sendErr && data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setInputValue("");
    }
    setSending(false);
  }

  function handleImageBtnClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !conversationId || uploading) return;
    if (!validateChatImage(file).ok) return;
    setUploading(true);
    const safeName = sanitizeFilename(file.name);
    const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type });
    if (!uploadErr) {
      const { data, error: insertErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content: "",
          message_type: "image",
          attachment_url: path,
        })
        .select()
        .single();
      if (!insertErr && data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    }
    setUploading(false);
  }

  return (
    <motion.aside
      className="chat-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <header className="chat-header">
        <button className="chat-back-btn" onClick={onClose} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <button
          className="chat-header-user"
          onClick={() => navigate(`/profile/${otherUser.username}`)}
        >
          <div className="chat-header-avatar">
            <Avatar
              avatarUrl={otherUser.avatar_url}
              name={otherUser.full_name || otherUser.username}
            />
          </div>
          <div className="chat-header-names">
            <span className="chat-header-name">{otherUser.full_name || otherUser.username}</span>
            {otherTyping ? (
              <span className="chat-header-typing">typing…</span>
            ) : (
              <span className="chat-header-username">@{otherUser.username}</span>
            )}
          </div>
        </button>
        <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>
      </header>

      <div className="chat-messages" ref={messagesContainerRef}>
        {loading ? (
          <div className="chat-loading"><Loader2 size={20} className="spin" /></div>
        ) : error ? (
          <div className="chat-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">No messages yet — start the conversation</div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={m.sender_id === session.user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <div className="chat-emoji-wrap" ref={emojiWrapRef}>
          <button
            type="button"
            className={`chat-icon-btn ${showEmojiPicker ? "is-active" : ""}`}
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Emoji"
          >
            <Smile size={18} />
          </button>
          {showEmojiPicker && (
            <div className="chat-emoji-popover">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                theme={Theme.DARK}
                width={320}
                height={380}
                searchPlaceholder="Search emoji"
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                lazyLoadEmojis
              />
            </div>
          )}
        </div>
        <button
          type="button"
          className="chat-icon-btn"
          onClick={handleImageBtnClick}
          disabled={uploading || !conversationId}
          aria-label="Attach image"
        >
          {uploading ? <Loader2 size={18} className="spin" /> : <ImageIcon size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div className="chat-gif-wrap" ref={gifWrapRef}>
          <button
            type="button"
            className={`chat-icon-btn ${showGifPicker ? "is-active" : ""}`}
            onClick={() => setShowGifPicker((v) => !v)}
            disabled={!conversationId}
            aria-label="GIF"
          >
            <Paperclip size={18} />
          </button>
          {showGifPicker && <GifPicker onSelect={handleSelectGif} />}
        </div>
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Message..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            broadcastTyping();
          }}
          disabled={loading || !!error}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={sending || !inputValue.trim() || !conversationId}
          aria-label="Send"
        >
          {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
    </motion.aside>
  );
}

