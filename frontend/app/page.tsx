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

const DEFAULT_BOT_MESSAGE: Message = {
  role: "bot",
  content: "Namaste. I am shlokaAI, a guide rooted in the wisdom of the Bhagavad Gita. What weighs on your heart today?",
};

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
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

  // Save to localStorage when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("shlokaai_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [DEFAULT_BOT_MESSAGE];

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
    return "New Conversation";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...currentMessages, userMessage];
    
    // If no active session, create one
    let sessionId = activeSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = Date.now().toString();
      isNewSession = true;
      const newSession: ChatSession = {
        id: sessionId,
        title: "New Chat", // Temporary
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

    // If it's a new session, fire off title generation in the background
    if (isNewSession) {
      generateTitle(userMessage.content).then(title => {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title } : s
        ));
      });
    }

    try {
      // Build history, excluding the very first default bot message
      const history = newMessages
        .filter(m => m !== DEFAULT_BOT_MESSAGE)
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
      const errorMsg: Message = { role: "bot", content: `⚠️ I'm sorry, I could not process that. (${errorMessage})` };
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

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewSession}>
            <span style={{fontSize: "1.2rem"}}>+</span> New Chat
          </button>
        </div>
        
        <div className="chat-list">
          {sessions.length > 0 && <div className="chat-list-label">Past Conversations</div>}
          {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
            <button 
              key={session.id} 
              className={`chat-list-item ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => { setActiveSessionId(session.id); setSidebarOpen(false); }}
            >
              {session.title}
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
          <h1 className="logo-name" style={{fontSize: "1.2rem", marginLeft: "1rem"}}>shlokaAI</h1>
        </div>

        <header className="logo-section">
          <h1 className="logo-name">shlokaAI</h1>
          <p className="logo-tagline">Wisdom from the Bhagavad Gita</p>
        </header>

        {/* ── Chat Messages ── */}
        <div className="chat-container">
          {currentMessages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className={`message-bubble ${msg.role}`}>
                {msg.role === "user" ? (
                  <p>{msg.content}</p>
                ) : (
                  <>
                    {msg.theme && (
                      <div className="response-header">
                        <span className="response-label">Guidance</span>
                        <span className="theme-badge">✦ {msg.theme}</span>
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="sanskrit-section">
                        <p className="sanskrit-verse">{msg.citations[0].sanskrit}</p>
                        <p className="transliteration">{msg.citations[0].transliteration}</p>
                        <span className="verse-ref">{msg.citations[0].reference}</span>
                      </div>
                    )}

                    <div className="advice-text">{msg.content}</div>

                    {msg.citations && msg.citations.length > 1 && (
                      <div className="citations-list">
                        {msg.citations.slice(1).map((c) => (
                          <span key={c.reference} className="citation-pill" title={c.sanskrit}>
                            {c.reference}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message-row bot">
              <div className="message-bubble bot">
                <div className="loading-row">
                  <span className="loading-om">ॐ</span>
                  <span className="loading-text">Consulting the Gita...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* ── Input Box ── */}
        <div className="input-container">
          <form className="input-box" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input-field"
              placeholder="Share what weighs on your heart..."
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
              ✦
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
