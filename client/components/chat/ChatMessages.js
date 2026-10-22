"use client";
import { useRef, useEffect } from "react";
import ChatMessage, { TypingIndicator } from "./ChatMessage";

export default function ChatMessages({ messages, loading, onRetry }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      className="chat-messages"
      style={{
        flex: 1, overflowY: "auto", padding: "16px 0",
        display: "flex", flexDirection: "column",
      }}
    >
      {messages.map((msg, i) => (
        <ChatMessage
          key={i}
          message={msg}
          isLatest={i === messages.length - 1}
          onRetry={msg.error ? () => onRetry(i) : undefined}
        />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
