"use client";

import { useState, useRef, useEffect } from "react";

interface Citation {
  reference: string;
  sanskrit: string;
  transliteration: string;
}

interface Message {
  role: "user" | "bot";
  content: string;
  theme?: string;
  citations?: Citation[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const DEFAULT_MESSAGES: Message[] = [];

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ── Peacock Feather SVG Component ──────────────────────────────────────────
// Small icon version (for sidebar / topbar)
const PeacockFeatherIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size * 2.2}
    viewBox="0 0 100 220"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Peacock feather"
  >
    <defs>
      <radialGradient id="eye-outer" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1a3a6b"/>
        <stop offset="40%" stopColor="#1a6b6e"/>
        <stop offset="75%" stopColor="#2a9d6a"/>
        <stop offset="100%" stopColor="#c9993f" stopOpacity="0.8"/>
      </radialGradient>
      <radialGradient id="eye-mid" cx="50%" cy="55%" r="50%">
        <stop offset="0%" stopColor="#0d2f5e"/>
        <stop offset="60%" stopColor="#1a6b9d"/>
        <stop offset="100%" stopColor="#2a9d8f"/>
      </radialGradient>
      <linearGradient id="quill-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a9d6a"/>
        <stop offset="50%" stopColor="#1a6b6e"/>
        <stop offset="100%" stopColor="#c9993f"/>
      </linearGradient>
      <linearGradient id="barb-l" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#1a6b6e"/>
        <stop offset="100%" stopColor="#2a9d8f" stopOpacity="0.3"/>
      </linearGradient>
      <linearGradient id="barb-r" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1a6b6e"/>
        <stop offset="100%" stopColor="#264694" stopOpacity="0.3"/>
      </linearGradient>
    </defs>

    {/* Central rachis (quill shaft) */}
    <path d="M50 220 Q50 160 50 60" stroke="url(#quill-grad)" strokeWidth="1.2" fill="none"/>

    {/* Upper barbs fanning toward eye — left */}
    {[
      "M50 90 Q35 75 18 52", "M50 95 Q32 78 12 58", "M50 100 Q30 82 10 68",
      "M50 105 Q28 86 8 78", "M50 110 Q28 90 8 90",
    ].map((d, i) => (
      <path key={`ul${i}`} d={d} stroke="url(#barb-l)" strokeWidth="0.7" fill="none" opacity="0.85"/>
    ))}
    {/* Upper barbs — right */}
    {[
      "M50 90 Q65 75 82 52", "M50 95 Q68 78 88 58", "M50 100 Q70 82 90 68",
      "M50 105 Q72 86 92 78", "M50 110 Q72 90 92 90",
    ].map((d, i) => (
      <path key={`ur${i}`} d={d} stroke="url(#barb-r)" strokeWidth="0.7" fill="none" opacity="0.85"/>
    ))}

    {/* Lower barbs — left */}
    {[
      "M50 115 Q38 115 22 108", "M50 122 Q36 122 18 116", "M50 130 Q35 130 16 126",
      "M50 138 Q35 140 18 138", "M50 146 Q36 148 22 148", "M50 155 Q38 158 26 160",
      "M50 163 Q40 167 30 172", "M50 172 Q42 176 36 184",
    ].map((d, i) => (
      <path key={`ll${i}`} d={d} stroke="#1a6b6e" strokeWidth="0.6" fill="none" opacity="0.7"/>
    ))}
    {/* Lower barbs — right */}
    {[
      "M50 115 Q62 115 78 108", "M50 122 Q64 122 82 116", "M50 130 Q65 130 84 126",
      "M50 138 Q65 140 82 138", "M50 146 Q64 148 78 148", "M50 155 Q62 158 74 160",
      "M50 163 Q60 167 70 172", "M50 172 Q58 176 64 184",
    ].map((d, i) => (
      <path key={`lr${i}`} d={d} stroke="#264694" strokeWidth="0.6" fill="none" opacity="0.7"/>
    ))}

    {/* Gold accent barbs */}
    <path d="M50 130 Q32 132 12 130" stroke="#c9993f" strokeWidth="0.5" fill="none" opacity="0.5"/>
    <path d="M50 130 Q68 132 88 130" stroke="#c9993f" strokeWidth="0.5" fill="none" opacity="0.5"/>

    {/* Eye — outer glow ring */}
    <ellipse cx="50" cy="75" rx="26" ry="22" fill="url(#eye-outer)" opacity="0.25"/>
    {/* Eye — main colored ring */}
    <ellipse cx="50" cy="75" rx="20" ry="16" fill="none" stroke="#2a9d6a" strokeWidth="1.5" opacity="0.8"/>
    {/* Eye — gold ring */}
    <ellipse cx="50" cy="75" rx="15" ry="12" fill="none" stroke="#c9993f" strokeWidth="1.2" opacity="0.7"/>
    {/* Eye — teal fill */}
    <ellipse cx="50" cy="75" rx="11" ry="8.5" fill="#1a6b9d" opacity="0.7"/>
    {/* Eye — dark pupil */}
    <ellipse cx="50" cy="75" rx="6" ry="5" fill="#0d2240" opacity="0.9"/>
    {/* Eye — highlight */}
    <ellipse cx="48" cy="73" rx="2" ry="1.5" fill="white" opacity="0.4"/>
  </svg>
);

// ── Large background feather (watermark) ──────────────────────────────────
const PeacockFeatherBg = () => (
  <svg
    className="feather-bg"
    viewBox="0 0 300 700"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="bg-eye-outer" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1a3a6b" stopOpacity="0.3"/>
        <stop offset="50%" stopColor="#1a6b6e" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#c9993f" stopOpacity="0.05"/>
      </radialGradient>
      <linearGradient id="bg-barb-l" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#1a6b6e" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#2a9d8f" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="bg-barb-r" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#264694" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#264694" stopOpacity="0"/>
      </linearGradient>
    </defs>

    {/* Rachis */}
    <path d="M150 700 Q150 500 150 180" stroke="#1a6b6e" strokeWidth="2" fill="none" opacity="0.2"/>

    {/* Upper barb fans — left (many) */}
    {[
      ["M150 250 Q110 210 50 130","#2a9d6a"],["M150 265 Q105 225 30 155","#1a6b6e"],
      ["M150 280 Q100 240 20 178","#264694"],["M150 295 Q98 255 15 205","#2a9d6a"],
      ["M150 310 Q98 270 15 235","#1a6b6e"],["M150 320 Q98 285 15 265","#264694"],
    ].map(([d, c], i) => (
      <path key={`bgl${i}`} d={d} stroke={c} strokeWidth="1.2" fill="none" opacity="0.18"/>
    ))}
    {/* Upper barb fans — right */}
    {[
      ["M150 250 Q190 210 250 130","#2a9d6a"],["M150 265 Q195 225 270 155","#1a6b6e"],
      ["M150 280 Q200 240 280 178","#264694"],["M150 295 Q202 255 285 205","#2a9d6a"],
      ["M150 310 Q202 270 285 235","#1a6b6e"],["M150 320 Q202 285 285 265","#264694"],
    ].map(([d, c], i) => (
      <path key={`bgr${i}`} d={d} stroke={c} strokeWidth="1.2" fill="none" opacity="0.18"/>
    ))}

    {/* Lower barbs — left */}
    {[
      "M150 330 Q118 335 68 325","M150 345 Q115 352 60 346","M150 360 Q112 368 55 368",
      "M150 378 Q112 386 58 390","M150 396 Q114 406 65 414","M150 415 Q118 426 74 440",
      "M150 435 Q122 448 85 465","M150 456 Q128 470 98 490",
      "M150 478 Q133 492 112 516","M150 500 Q138 515 125 542",
    ].map((d, i) => (
      <path key={`bll${i}`} d={d} stroke="#1a6b6e" strokeWidth="1" fill="none" opacity="0.15"/>
    ))}
    {/* Lower barbs — right */}
    {[
      "M150 330 Q182 335 232 325","M150 345 Q185 352 240 346","M150 360 Q188 368 245 368",
      "M150 378 Q188 386 242 390","M150 396 Q186 406 235 414","M150 415 Q182 426 226 440",
      "M150 435 Q178 448 215 465","M150 456 Q172 470 202 490",
      "M150 478 Q167 492 188 516","M150 500 Q162 515 175 542",
    ].map((d, i) => (
      <path key={`blr${i}`} d={d} stroke="#264694" strokeWidth="1" fill="none" opacity="0.15"/>
    ))}

    {/* Gold accent barbs */}
    <path d="M150 360 Q108 370 48 372" stroke="#c9993f" strokeWidth="0.8" fill="none" opacity="0.12"/>
    <path d="M150 360 Q192 370 252 372" stroke="#c9993f" strokeWidth="0.8" fill="none" opacity="0.12"/>
    <path d="M150 415 Q118 428 72 438" stroke="#c9993f" strokeWidth="0.8" fill="none" opacity="0.1"/>
    <path d="M150 415 Q182 428 228 438" stroke="#c9993f" strokeWidth="0.8" fill="none" opacity="0.1"/>

    {/* Eye — outer */}
    <ellipse cx="150" cy="215" rx="78" ry="65" fill="url(#bg-eye-outer)"/>
    <ellipse cx="150" cy="215" rx="60" ry="50" fill="none" stroke="#2a9d6a" strokeWidth="1.5" opacity="0.2"/>
    <ellipse cx="150" cy="215" rx="44" ry="37" fill="none" stroke="#c9993f" strokeWidth="1.2" opacity="0.18"/>
    <ellipse cx="150" cy="215" rx="30" ry="25" fill="#1a6b9d" opacity="0.12"/>
    <ellipse cx="150" cy="215" rx="16" ry="14" fill="#0d2240" opacity="0.12"/>
  </svg>
);

// ── Decorative mandala for empty state ────────────────────────────────────
const MandalaDecoration = () => (
  <svg className="empty-mandala" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="100" cy="100" r="90" stroke="#2a9d8f" strokeWidth="0.6" opacity="0.4"/>
    <circle cx="100" cy="100" r="70" stroke="#264694" strokeWidth="0.6" opacity="0.4"/>
    <circle cx="100" cy="100" r="50" stroke="#c9993f" strokeWidth="0.6" opacity="0.4"/>
    <circle cx="100" cy="100" r="30" stroke="#2a9d8f" strokeWidth="0.6" opacity="0.4"/>
    <circle cx="100" cy="100" r="10" stroke="#264694" strokeWidth="0.6" opacity="0.4"/>
    {[0,45,90,135,180,225,270,315].map(angle => {
      const rad = (angle * Math.PI) / 180;
      return (
        <line key={angle}
          x1={100 + 10 * Math.cos(rad)} y1={100 + 10 * Math.sin(rad)}
          x2={100 + 90 * Math.cos(rad)} y2={100 + 90 * Math.sin(rad)}
          stroke="#1a6b6e" strokeWidth="0.5" opacity="0.3"/>
      );
    })}
    {[0,45,90,135,180,225,270,315].map(angle => {
      const rad = (angle * Math.PI) / 180;
      return (
        <circle key={`d-${angle}`}
          cx={100 + 70 * Math.cos(rad)} cy={100 + 70 * Math.sin(rad)}
          r="4" fill="#c9993f" fillOpacity="0.25"/>
      );
    })}
  </svg>
);


export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("shlokaai_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveSessionId(parsed[0].id);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0)
      localStorage.setItem("shlokaai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : DEFAULT_MESSAGES;

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, loading]);

  const createNewSession = () => {
    setActiveSessionId(null);
    if (isMobile) setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const generateTitle = async (query: string): Promise<string> => {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) return (await res.json()).title;
    } catch (e) { console.error(e); }
    return "New Volume";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...currentMessages, userMessage];
    let sessionId = activeSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = Date.now().toString();
      isNewSession = true;
      setSessions(prev => [{ id: sessionId!, title: "New Volume", messages: newMessages, updatedAt: Date.now() }, ...prev]);
      setActiveSessionId(sessionId);
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: newMessages, updatedAt: Date.now() } : s));
    }

    setInput("");
    setLoading(true);

    if (isNewSession)
      generateTitle(userMessage.content).then(title =>
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s))
      );

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content, history: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const botMessage: Message = { role: "bot", content: data.response, theme: data.theme, citations: data.citations };
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, botMessage], updatedAt: Date.now() } : s));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      const errorMsg: Message = { role: "bot", content: `(The scribe encountered an error: ${msg})` };
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() } : s));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const exchanges: { user: Message; bot?: Message }[] = [];
  let currentExchange: { user: Message; bot?: Message } | null = null;
  currentMessages.forEach(msg => {
    if (msg.role === "user") {
      if (currentExchange) exchanges.push(currentExchange);
      currentExchange = { user: msg };
    } else if (msg.role === "bot" && currentExchange) {
      currentExchange.bot = msg;
      exchanges.push(currentExchange);
      currentExchange = null;
    }
  });
  if (currentExchange) exchanges.push(currentExchange);

  const sidebarClass = isMobile
    ? `sidebar ${sidebarOpen ? "open" : ""}`
    : `sidebar ${sidebarOpen ? "" : "collapsed"}`;

  return (
    <div className="app-layout">
      {/* ── Large background peacock feather watermark ── */}
      <PeacockFeatherBg />

      {/* ── Sidebar ── */}
      <div className={sidebarClass}>
        <div className="sidebar-brand">
          <PeacockFeatherIcon size={20} />
          <span className="sidebar-title">shlokaAI</span>
          <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Close sidebar">
            <IconClose />
          </button>
        </div>

        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewSession}>+ Inscribe New</button>
        </div>

        <div className="chat-list">
          {sessions.length > 0 && <div className="chat-list-label">Archive</div>}
          {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
            <button
              key={session.id}
              className={`chat-list-item ${session.id === activeSessionId ? "active" : ""}`}
              onClick={() => { setActiveSessionId(session.id); if (isMobile) setSidebarOpen(false); }}
            >
              {session.title === "New Volume" && loading && session.id === activeSessionId
                ? <span style={{ opacity: 0.5 }}>inscribing&hellip;</span>
                : session.title}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isMobile && sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Main Area ── */}
      <main className="main-area">
        {/* Persistent topbar */}
        <div className="desktop-topbar">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
            <IconMenu />
          </button>
          <div className="topbar-colophon">
            <PeacockFeatherIcon size={14} />
            <span className="topbar-title">shlokaAI</span>
            <span className="topbar-subtitle">Bhagavad Gita</span>
          </div>
        </div>

        {/* ── Chat scroll area ── */}
        <div className="chat-container">
          {currentMessages.length === 0 && (
            <div className="empty-state editorial-flow">
              <MandalaDecoration />
              <h1 className="empty-title">shlokaAI</h1>
              <p className="empty-subtitle">Wisdom from the Bhagavad Gita</p>
              <div className="empty-ornament">❈</div>
              <p className="empty-invitation">
                Begin by sharing what weighs on your mind.<br />
                The Gita has held many answers for many lives.
              </p>
            </div>
          )}

          {exchanges.map((exchange, idx) => (
            <div key={idx} className="exchange-block editorial-flow">
              <div className="editorial-query-wrap">
                <span className="query-label">प्रश्न</span>
                <p className="editorial-query">{exchange.user.content}</p>
              </div>

              {exchange.bot && <div className="query-to-response-rule">❈</div>}

              {exchange.bot && (
                <div className="editorial-response">
                  {exchange.bot.theme && (
                    <div className="response-header">
                      <span className="theme-badge">{exchange.bot.theme}</span>
                    </div>
                  )}

                  {exchange.bot.citations && exchange.bot.citations.length > 0 && (
                    <div className="sanskrit-section">
                      <p className="sanskrit-verse">{exchange.bot.citations[0].sanskrit}</p>
                      <p className="transliteration">{exchange.bot.citations[0].transliteration}</p>
                      <span className="verse-ref">{exchange.bot.citations[0].reference}</span>
                    </div>
                  )}

                  <div className="advice-text">{exchange.bot.content}</div>

                  {exchange.bot.citations && exchange.bot.citations.length > 1 && (
                    <div className="citations-list">
                      {exchange.bot.citations.slice(1).map(c => (
                        <span key={c.reference} className="citation-inline" title={c.sanskrit}>{c.reference}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {idx < exchanges.length - 1 && (
                <div className="exchange-separator">✧ &nbsp; ✧ &nbsp; ✧</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="loading-row editorial-flow">
              <svg className="yantra-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40"/>
                <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)"/>
                <circle cx="50" cy="50" r="10"/>
              </svg>
              <span className="loading-text">Seeking</span>
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        {/* ── Input ── */}
        <div className="input-container">
          <span className="input-prompt-label">वदतु — Speak</span>
          <form className="input-box" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input-field"
              placeholder="Inscribe your thoughts here…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={!input.trim() || loading} aria-label="Send message">
              <IconArrow />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
