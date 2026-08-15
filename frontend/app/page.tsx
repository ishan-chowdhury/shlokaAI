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

// Remove the default bot message. We want a blank page until the user speaks,
// to emphasize the "quiet, spacious" feel.
const DEFAULT_MESSAGES: Message[] = [];

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shlokaai_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("shlokaai_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : DEFAULT_MESSAGES;

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, loading]);

  const createNewSession = () => {
    setActiveSessionId(null);
    setSidebarOpen(false);
  };

  const generateTitle = async (query: string): Promise<string> => {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.title;
      }
    } catch (e) {
      console.error(e);
    }
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
      const newSession: ChatSession = {
        id: sessionId,
        title: "New Volume",
        messages: newMessages,
        updatedAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    } else {
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: newMessages, updatedAt: Date.now() }
          : s
      ));
    }

    setInput("");
    setLoading(true);

    if (isNewSession) {
      generateTitle(userMessage.content).then(title => {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title } : s
        ));
      });
    }

    try {
      const history = newMessages
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const botMessage: Message = {
        role: "bot",
        content: data.response,
        theme: data.theme,
        citations: data.citations
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, botMessage], updatedAt: Date.now() }
          : s
      ));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      const errorMsg: Message = { role: "bot", content: `(The scribe encountered an error: ${errorMessage})` };
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }
          : s
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Group messages into exchanges (User -> Bot) to render them as single continuous editorial blocks
  const exchanges: { user: Message, bot?: Message }[] = [];
  let currentExchange: { user: Message, bot?: Message } | null = null;

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

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewSession}>
            Inscribe New
          </button>
        </div>
        
        <div className="chat-list">
          {sessions.length > 0 && <div className="chat-list-label">Archive</div>}
          {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
            <button 
              key={session.id} 
              className={`chat-list-item ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => { setActiveSessionId(session.id); setSidebarOpen(false); }}
            >
              {session.title === 'New Volume' && loading && session.id === activeSessionId
                ? <span style={{opacity: 0.5}}>inscribing&nbsp;&hellip;</span>
                : session.title
              }
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* ── Main Area ── */}
      <main className="main-area">
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        </div>

        {/* ── Continuous Editorial Flow ── */}
        <div className="chat-container">
          
          {/* Empty state — visible before any conversation starts */}
          {currentMessages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '12vh' }} className="editorial-flow">
              <h1 className="logo-name" style={{fontSize: "3rem", color: "var(--cream)", letterSpacing: '0.1em'}}>shlokaAI</h1>
              <p style={{fontStyle: 'italic', color: 'var(--gold-dim)', marginTop: '1rem', fontSize: '1.05rem'}}>Wisdom from the Bhagavad Gita</p>
              <p style={{color: 'var(--text-muted)', marginTop: '3rem', fontSize: '0.95rem', lineHeight: '1.8'}}>Begin by sharing what weighs on your mind.<br/>The Gita has held many answers for many lives.</p>
            </div>
          )}

          {exchanges.map((exchange, idx) => (
            <div key={idx} className="exchange-block editorial-flow">

              {/* User query — subordinate label + muted italic */}
              <div className="editorial-query-wrap">
                <span className="query-label">प्रश्न</span>
                <p className="editorial-query">{exchange.user.content}</p>
              </div>

              {/* Thin ornamental rule separating query from response */}
              {exchange.bot && (
                <div className="query-to-response-rule">❈</div>
              )}

              {/* The AI's Response — dominant manuscript body */}
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
                      {exchange.bot.citations.slice(1).map((c) => (
                        <span key={c.reference} className="citation-inline" title={c.sanskrit}>
                          {c.reference}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Generous separator between exchanges */}
              {idx < exchanges.length - 1 && (
                <div className="exchange-separator">✧ &nbsp; ✧ &nbsp; ✧</div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="loading-row">
              <svg className="yantra-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" />
                <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" />
              </svg>
              <span className="loading-text">Seeking</span>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* ── Minimal Input Area ── */}
        <div className="input-container">
          <form className="input-box" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input-field"
              placeholder="Inscribe your thoughts here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              disabled={loading}
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
