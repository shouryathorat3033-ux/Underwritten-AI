"use client";

export default function FormattedText({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === "ul") {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, lineHeight: 1.55, color: "var(--chat-text)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", marginTop: 7, flexShrink: 0 }} />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, lineHeight: 1.55, color: "var(--chat-text)" }}>
              <span style={{ color: "#10b981", fontWeight: 600, fontSize: 12, marginTop: 1, flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "---") {
      flushList();
      elements.push(
        <div key={`hr-${i}`} style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)", margin: "4px 0" }} />
      );
      continue;
    }

    const bulletMatch = line.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    const numMatch = line.match(/^\d+\.\s+(.+)/);
    if (numMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(numMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === "") continue;

    const kvMatch = line.match(/^([A-Za-z\s]+):\s+(.+)/);
    if (kvMatch && kvMatch[1].length < 30) {
      elements.push(
        <div key={`kv-${i}`} style={{ display: "flex", gap: 6, fontSize: 13.5, lineHeight: 1.55 }}>
          <span style={{ color: "var(--chat-text-muted)" }}>{kvMatch[1]}:</span>
          <span style={{ color: "var(--chat-text-primary)" }}>{parseInline(kvMatch[2])}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--chat-text)" }}>
        {parseInline(line)}
      </p>
    );
  }

  flushList();

  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{elements}</div>;
}

function parseInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 600, color: "var(--chat-text-primary)" }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <code key={match.index} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em", background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "1px 5px", borderRadius: 4 }}>
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      parts.push(
        <a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer"
          style={{ color: "#10b981", textDecoration: "none", borderBottom: "1px solid rgba(16,185,129,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#10b981")}
          onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "rgba(16,185,129,0.3)")}>
          {match[6]}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
