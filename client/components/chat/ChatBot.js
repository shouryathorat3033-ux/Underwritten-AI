"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "./ChatContext";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatEmptyState from "./ChatEmptyState";
import ActionConfirmation from "./ActionConfirmation";
import { sendMessage, fetchSuggestions, loadChat, saveChat } from "./utils";

export default function ChatBot() {
  const { isOpen, closeChat } = useChat();
  const pathname = usePathname();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [actionOverlay, setActionOverlay] = useState(null);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    setMessages(loadChat());
    setMounted(true);
  }, []);

  // Save messages on change
  useEffect(() => {
    if (mounted && messages.length > 0) saveChat(messages);
  }, [messages, mounted]);

  // Fetch suggestions when chat opens or page changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setSuggestionsLoading(true);
      fetchSuggestions(pathname).then((s) => {
        setSuggestions(s);
        setSuggestionsLoading(false);
      });
    }
  }, [isOpen, pathname, messages.length]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      closeChat();
      setClosing(false);
    }, 250);
  }, [closeChat]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setSuggestions([]);
    saveChat([]);
    setSuggestionsLoading(true);
    fetchSuggestions(pathname).then((s) => {
      setSuggestions(s);
      setSuggestionsLoading(false);
    });
  }, [pathname]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg, timestamp: Date.now() };
    const assistantPlaceholder = { role: "assistant", content: "", timestamp: Date.now() };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await sendMessage(msg, pathname, history, (partial) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: partial };
          return updated;
        });
      });

      if (result.type === "action") {
        const { data } = result;

        if (data.action === "navigate") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "system", content: data.message || "Navigating...", timestamp: Date.now(),
            };
            return updated;
          });
          router.push(data.path);
        } else if (data.action === "created") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant", content: data.message || "Created successfully!", timestamp: Date.now(),
            };
            return updated;
          });
          setActionOverlay({ entity: data.entity, data: data.data, id: data.id });
        } else if (data.action === "autofill") {
          window.dispatchEvent(new CustomEvent("app:autofill", { detail: data.fields }));
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "I've filled in the fields for you. Review and adjust as needed.",
              timestamp: Date.now(),
            };
            return updated;
          });
        } else if (data.action === "error") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant", content: data.message, timestamp: Date.now(), error: true,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: err.message || "Something went wrong. Please try again.",
          timestamp: Date.now(),
          error: true,
        };
        return updated;
      });
    }

    setLoading(false);
  }, [input, loading, messages, pathname, router]);

  // Listen for prefill events from AskAI buttons — must be after handleSend
  useEffect(() => {
    const handler = (e) => {
      const question = e.detail;
      if (question && typeof question === "string") {
        setInput(question);
        setTimeout(() => {
          try { handleSend(question); } catch { /* input is set, user can press Enter */ }
        }, 200);
      }
    };
    window.addEventListener("app:chat-prefill", handler);
    return () => window.removeEventListener("app:chat-prefill", handler);
  }, [handleSend]);

  const handleRetry = useCallback((index) => {
    const userMsgIndex = index - 1;
    if (userMsgIndex >= 0 && messages[userMsgIndex]?.role === "user") {
      const retryText = messages[userMsgIndex].content;
      setMessages((prev) => prev.slice(0, userMsgIndex));
      setTimeout(() => handleSend(retryText), 100);
    }
  }, [messages, handleSend]);

  if (!isOpen && !closing) return null;

  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/applicant/dashboard") || pathname?.startsWith("/admin/dashboard");

  return (
    <>
      {/* Mobile overlay */}
      {(isOpen || closing) && (
        <div
          onClick={handleClose}
          className="lg:hidden"
          style={{
            position: "fixed", inset: 0, zIndex: 45,
            background: "rgba(0,0,0,0.5)",
            opacity: closing ? 0 : 1,
            transition: "opacity 0.25s",
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: "100%",
        maxWidth: 480,
        zIndex: isDashboard ? 40 : 50,
        background: "var(--chat-bg)",
        borderLeft: "1px solid var(--chat-border)",
        boxShadow: "var(--chat-shadow)",
        display: "flex", flexDirection: "column",
        animation: closing
          ? "chat-panel-out 0.25s cubic-bezier(0.4,0,1,1) forwards"
          : "chat-panel-in 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <ChatHeader onNewChat={handleNewChat} onClose={handleClose} />

        {messages.length === 0 ? (
          <ChatEmptyState
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            onSuggestionClick={(s) => handleSend(s)}
          />
        ) : (
          <ChatMessages
            messages={messages}
            loading={loading}
            onRetry={handleRetry}
          />
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          loading={loading}
          suggestions={messages.length > 0 ? suggestions.slice(0, 3) : []}
          onSuggestionClick={(s) => handleSend(s)}
        />
      </div>

      <ActionConfirmation
        overlay={actionOverlay}
        onClose={() => setActionOverlay(null)}
        onNavigate={(path) => router.push(path)}
      />
    </>
  );
}
