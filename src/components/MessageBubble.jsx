import React, { memo } from "react";
import AttachmentImage from "./AttachmentImage";
import { formatMessageTime } from "../lib/messaging";

function MessageBubble({ message, mine }) {
  const isMedia = message.message_type === "image" || message.message_type === "gif";
  return (
    <div className={`chat-bubble-row ${mine ? "mine" : "theirs"}`}>
      <div className={`chat-bubble ${isMedia ? "chat-bubble-media" : ""}`}>
        {message.message_type === "image" ? (
          <AttachmentImage path={message.attachment_url} />
        ) : message.message_type === "gif" ? (
          <img src={message.attachment_url} alt="GIF" className="chat-image" />
        ) : (
          <div className="chat-bubble-content">{message.content}</div>
        )}
        <div className="chat-bubble-time">{formatMessageTime(message.created_at)}</div>
      </div>
    </div>
  );
}

// Equality check: re-render only when the message identity changes (different id
// or content/attachment was edited). Most messages are immutable once sent.
export default memo(MessageBubble, (prev, next) => {
  return (
    prev.mine === next.mine &&
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.attachment_url === next.message.attachment_url
  );
});
