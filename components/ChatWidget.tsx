'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api');

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Ozzy, tu asistente de NegociClick 👋 ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

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

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Abrir chat de soporte"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Panel del chat */}
      {open && (
        <>
          {/* Overlay solo en móvil */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className={`
            fixed z-50 flex flex-col overflow-hidden shadow-2xl border border-gray-200
            /* Móvil: bottom sheet que ocupa casi toda la pantalla */
            bottom-0 left-0 right-0 rounded-t-2xl
            h-[85vh]
            /* Desktop: widget flotante en esquina */
            sm:bottom-6 sm:right-6 sm:left-auto sm:rounded-2xl
            sm:w-80 sm:h-[500px]
          `}>

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">Ozzy</p>
                  <p className="text-white/70 text-xs mt-0.5">Asistente NegociClick</p>
                </div>
                <span className="w-2 h-2 bg-emerald-400 rounded-full ml-1" />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Cerrar chat"
              >
                <ChevronDown className="w-5 h-5 sm:hidden" />
                <X className="w-5 h-5 hidden sm:block" />
              </button>
            </div>

            {/* Mensajes — scrollable */}
            <div
              ref={messagesRef}
              className="flex-1 bg-white overflow-y-auto p-4 space-y-3"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        h2: ({ children }) => <p className="font-bold mt-1">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold mt-1">{children}</p>,
                        table: ({ children }) => <table className="text-xs border-collapse w-full mt-1">{children}</table>,
                        th: ({ children }) => <th className="border border-gray-300 px-1.5 py-0.5 bg-gray-200 font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-gray-300 px-1.5 py-0.5">{children}</td>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Sugerencias rápidas */}
            {messages.length === 1 && (
              <div className="bg-white px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {['¿Cómo me registro?', 'Planes y precios', 'Recuperar contraseña'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(send, 0); }}
                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 hover:bg-indigo-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu consulta..."
                maxLength={500}
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
