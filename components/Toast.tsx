'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const META = {
  success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon_color: 'text-green-500' },
  error:   { icon: XCircle,     bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   icon_color: 'text-red-500' },
  info:    { icon: AlertCircle, bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-800',  icon_color: 'text-blue-500' },
};

export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const m = META[type];
  const Icon = m.icon;

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [duration, onClose]);

  return (
    <div className={`flex items-center gap-3 min-w-[280px] max-w-sm border rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ${m.bg} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${m.icon_color}`} />
      <p className={`text-sm font-medium flex-1 ${m.text}`}>{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className={`${m.icon_color} opacity-60 hover:opacity-100 transition-opacity`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook simple para gestionar toasts
import { createContext, useContext, useCallback, useRef } from 'react';

interface ToastEntry { id: number; message: string; type: ToastType; }
interface ToastContextValue { show: (message: string, type?: ToastType) => void; }

const ToastCtx = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
