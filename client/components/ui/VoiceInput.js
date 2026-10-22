"use client";
import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Voice input button using Web Speech API.
 * Zero dependencies — uses the browser's built-in speech recognition.
 */
export default function VoiceInput({ onTranscript, disabled = false }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && onTranscript) onTranscript(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onTranscript]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? "Stop recording" : "Voice input"}
      style={{
        width: 32, height: 32, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        background: listening ? "rgba(239,68,68,0.15)" : "var(--chat-send-bg, rgba(255,255,255,0.06))",
        color: listening ? "#ef4444" : "var(--chat-text-muted, #71717a)",
        transition: "all 0.2s",
        animation: listening ? "soft-pulse 1.5s ease-in-out infinite" : "none",
        boxShadow: listening ? "0 0 12px rgba(239,68,68,0.2)" : "none",
      }}
      onMouseEnter={(e) => { if (!listening && !disabled) e.currentTarget.style.color = "#fafafa"; }}
      onMouseLeave={(e) => { if (!listening) e.currentTarget.style.color = "var(--chat-text-muted, #71717a)"; }}
    >
      {listening ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
