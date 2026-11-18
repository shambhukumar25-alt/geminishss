import { useEffect, useRef, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function GeminiChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const conversationRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "24px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [prompt]);

  async function sendMessage(text = prompt) {
    const submittedPrompt = text.trim();
    if (!submittedPrompt || loading) return;

    setPrompt("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: submittedPrompt },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/gemini/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: submittedPrompt }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: data.text || "No response received." },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Unable to reach Gemini: ${error.message}`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function copyMessage(message) {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  function startNewChat() {
    setMessages([]);
    setPrompt("");
  }

  const suggestions = [
    ["✦", "Plan a productive day", "Create a focused schedule for my day"],
    ["<>", "Write and improve", "Help me write a professional email"],
    ["◫", "Explain a concept", "Explain quantum computing in simple terms"],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="gemini-mark"><span></span><span></span><span></span></div>
          <span>Gemini</span>
        </div>

        <button className="new-chat" type="button" onClick={startNewChat}>
          <span className="plus">+</span>
          <span>New chat</span>
        </button>

        <nav className="history" aria-label="Recent chats">
          <p className="history-title">Recent</p>
          {messages.length > 0 && (
            <button className="history-item active" type="button" onClick={() => conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight })}>
              <span className="history-dot"></span>
              <span>Current conversation</span>
            </button>
          )}
        </nav>

        <button className="profile" type="button">
          <span className="profile-avatar">SK</span>
          <span className="profile-copy">
            <strong>My workspace</strong>
            <small>Personal account</small>
          </span>
          <span className="more">•••</span>
        </button>
      </aside>

      <main className="chat">
        <header className="topbar">
          <button className="model-selector" type="button">
            <span>Gemini 3.8 Flash</span>
            <span className="chevron">⌄</span>
          </button>
          <div className="top-actions">
            <button type="button" aria-label="Share">↗</button>
            <button type="button" aria-label="More options">•••</button>
          </div>
        </header>

        <section className={`conversation ${messages.length ? "has-content" : ""}`} ref={conversationRef}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-sparkle">✦</div>
              <h1>Good evening, Shambhu</h1>
              <p>What can I help you with today?</p>

              <div className="suggestions">
                {suggestions.map(([icon, title, promptText]) => (
                  <button type="button" key={title} onClick={() => sendMessage(promptText)}>
                    <span className="suggestion-icon">{icon}</span>
                    <span className="suggestion-copy">
                      <strong>{title}</strong>
                      <small>{promptText}</small>
                    </span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  {message.role === "assistant" && <div className="assistant-mark">✦</div>}
                  <div className="message-body">
                    {message.role === "assistant" && <div className="message-name">Gemini</div>}
                    <p className={message.error ? "error-message" : ""}>{message.text}</p>
                    {message.role === "assistant" && (
                      <div className="message-actions">
                        <button type="button" onClick={() => copyMessage(message)}>
                          {copiedId === message.id ? "✓ Copied" : "⧉ Copy"}
                        </button>
                        <button type="button" aria-label="Good response">♡</button>
                        <button type="button" aria-label="Bad response">♧</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="assistant-mark">✦</div>
                  <div className="typing" aria-label="Gemini is generating">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="composer-wrap">
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini"
              rows="1"
              aria-label="Message Gemini"
            />
            <div className="composer-actions">
              <div className="composer-tools">
                <button type="button" aria-label="Add attachment">+</button>
                <button type="button" className="tools-button"><span>◆</span> Tools</button>
              </div>
              <button
                className="send-button"
                type="button"
                onClick={() => sendMessage()}
                disabled={!prompt.trim() || loading}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
          </div>
          <p className="disclaimer">Gemini can make mistakes. Check important info.</p>
        </div>
      </main>
    </div>
  );
}
