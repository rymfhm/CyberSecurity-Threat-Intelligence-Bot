"use client";

import { useState, useRef, useEffect } from "react";
import "./globals.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    sourceUrl?: string;
    score: number;
  }>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
          maxResults: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="header">
        <h1>🛡️ Cybersecurity Threat Intelligence Bot</h1>
        <p>Ask questions about CVEs, vulnerabilities, and threat intelligence</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <h3>Welcome to the Threat Intelligence Bot</h3>
              <p>Ask me about vulnerabilities, CVEs, or threat trends</p>
              <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
                Example: &quot;What critical vulnerabilities affected Windows Server 2019 in the last 30 days?&quot;
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-bubble">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                  {message.content}
                </pre>
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <h4>Sources ({message.sources.length}):</h4>
                  <ul className="sources-list">
                    {message.sources.map((source, idx) => (
                      <li key={idx} className="source-item">
                        <strong>{source.id}</strong>: {source.title}
                        {source.sourceUrl && (
                          <>
                            {" "}
                            <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                              (View Source)
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-bubble">
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <span>Analyzing threat intelligence...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="chat-input-form">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vulnerabilities, CVEs, or threat intelligence..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}




