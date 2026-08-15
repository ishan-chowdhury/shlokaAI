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

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Namaste. I am shlokaAI, a guide rooted in the wisdom of the Bhagavad Gita. What weighs on your heart today?",
    }
  ]);
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
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

      setMessages(prev => [...prev, botMessage]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setMessages(prev => [...prev, { role: "bot", content: `⚠️ I'm sorry, I could not process that. (${errorMessage})` }]);
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
    <main className="page-wrapper">
      {/* ── Header ── */}
      <header className="logo-section">
        <h1 className="logo-name">shlokaAI</h1>
        <p className="logo-tagline">Wisdom from the Bhagavad Gita</p>
      </header>

      {/* ── Chat Messages ── */}
      <div className="chat-container">
        {messages.map((msg, idx) => (
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
  );
}
