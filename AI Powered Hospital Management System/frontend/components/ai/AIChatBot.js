'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { aiAPI } from '@/lib/api';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "Hello! I'm your HMS AI Assistant. How can I help you today?",
};

const QUICK_ACTIONS = [
  { label: '🩺 Analyze Symptoms',      prompt: 'I would like to analyze my symptoms.' },
  { label: '📅 Book Appointment',      prompt: 'Help me book an appointment.' },
  { label: '💊 Explain Prescription',  prompt: 'Can you explain my prescription?' },
];

function TypingIndicator() {
  return (
    <div className="ai-message bot" style={{ maxWidth: '60px' }}>
      <div className="ai-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function AIChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message whenever messages change
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const context = { role: user?.role || 'patient' };
      const res = await aiAPI.chat(trimmed, context);
      const reply =
        res?.data?.reply ||
        res?.data?.message ||
        res?.reply ||
        res?.message ||
        "I'm here to help. Could you provide more details?";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'Sorry, I encountered an issue. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  return (
    <>
      {/* Floating action button */}
      <button
        className="ai-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI Assistant"
        title="HMS AI Assistant"
      >
        🤖
      </button>

      {/* Chat window */}
      {open && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                  HMS AI Assistant
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                  Always here to help
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              style={{ color: 'white' }}
              onClick={() => setOpen(false)}
              aria-label="Close AI chat"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}

            {/* Typing animation */}
            {isTyping && <TypingIndicator />}

            {/* Quick actions – only shown when no conversation yet */}
            {messages.length === 1 && !isTyping && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                    onClick={() => sendMessage(action.prompt)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="ai-chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              aria-label="Chat message input"
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
