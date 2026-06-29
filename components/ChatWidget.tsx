'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Bot, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api');

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Nico, tu asistente de NegociClick 👋 ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1, -1).slice(-10);
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Lo siento, no pude procesar tu consulta. Intenta nuevamente.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocurrió un error. Por favor intenta nuevamente o contáctanos por WhatsApp.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        aria-label="Abrir chat de soporte"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Nico</p>
            <p className="text-white/70 text-xs mt-0.5">Asistente NegociClick</p>
          </div>
          <span className="w-2 h-2 bg-emerald-400 rounded-full ml-1" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(v => !v)} className="text-white/70 hover:text-white p-1 rounded transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 bg-white overflow-y-auto p-4 space-y-3" style={{ height: '360px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="bg-white px-4 pb-2 flex flex-wrap gap-1.5">
              {['¿Cómo me registro?', 'Planes y precios', 'Recuperar contraseña'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(send, 0); }}
                  className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 hover:bg-indigo-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu consulta..."
              maxLength={500}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
