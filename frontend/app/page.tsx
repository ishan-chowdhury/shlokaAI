"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

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

// ── Peacock Feather Eye Icon (square, vivid, visible at small sizes) ───────
const PeacockFeatherIcon = ({ size = 36 }: { size?: number }) => (
  <Image
    src="/peacock-eye.jpg"
    alt="Peacock feather eye"
    width={size}
    height={size}
    style={{
      objectFit: 'cover',
      borderRadius: '50%',
      display: 'block',
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(26, 107, 110, 0.25)',
    }}
  />
);

// ── Large background feather watermark (real image) ───────────────────────
const PeacockFeatherBg = () => (
  <div className="feather-bg" aria-hidden="true">
    <Image
      src="/peacock-bg.jpg"
      alt=""
      width={520}
      height={780}
      style={{ width: '100%', height: 'auto', opacity: 0.55, mixBlendMode: 'multiply' }}
      priority
    />
  </div>
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
          <PeacockFeatherIcon size={36} />
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
            <PeacockFeatherIcon size={28} />
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
