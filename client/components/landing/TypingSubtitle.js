"use client";
import { useState, useEffect } from "react";

const phrases = [
  "Analyze risk in seconds, not weeks",
  "Fuse traditional & alternative data",
  "AI-powered decisions you can trust",
  "Transform your underwriting pipeline",
];

export default function TypingSubtitle() {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout;
    if (!isDeleting && charIdx < current.length) {
      timeout = setTimeout(() => { setText(current.slice(0, charIdx + 1)); setCharIdx(charIdx + 1); }, 50);
    } else if (!isDeleting && charIdx === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIdx > 0) {
      timeout = setTimeout(() => { setText(current.slice(0, charIdx - 1)); setCharIdx(charIdx - 1); }, 30);
    } else {
      timeout = setTimeout(() => { setIsDeleting(false); setPhraseIdx((phraseIdx + 1) % phrases.length); }, 300);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, phraseIdx]);

  return (
    <p className="text-base sm:text-lg" style={{ color: "#a1a1aa", minHeight: "1.75em" }}>
      {text}
      <span style={{ color: "#f59e0b", animation: "typing-blink 1s infinite", marginLeft: "2px", fontWeight: "300" }}>|</span>
    </p>
  );
}
