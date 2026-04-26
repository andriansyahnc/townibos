'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getUser, rag, towns, type Town } from '@/lib/api';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

export default function RagPage() {
  const currentUser = getUser();
  const isSuperadmin = currentUser?.role === 'superadmin';

  const [townList, setTownList] = useState<Town[]>([]);
  const [selectedTownId, setSelectedTownId] = useState<string>(currentUser?.townId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  let nextId = useRef(0);

  useEffect(() => {
    if (isSuperadmin) {
      towns.list().then(setTownList).catch(() => {});
    }
  }, [isSuperadmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    if (!selectedTownId) {
      toast.error('Pilih domain terlebih dahulu');
      return;
    }

    const userMsg: Message = { id: nextId.current++, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { answer } = await rag.query(q, selectedTownId);
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', text: answer }]);
    } catch (err) {
      toast.error((err as Error).message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleRefresh() {
    if (!selectedTownId && !currentUser?.townId) {
      toast.error('Pilih domain terlebih dahulu');
      return;
    }
    setRefreshing(true);
    try {
      await rag.refresh(selectedTownId || currentUser?.townId);
      toast.success('Konteks RAG berhasil diperbarui');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeTownName = isSuperadmin
    ? townList.find((t) => t._id === selectedTownId)?.name
    : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tanya AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Coba chatbot peraturan berbasis RAG
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperadmin && (
            <select
              value={selectedTownId}
              onChange={(e) => {
                setSelectedTownId(e.target.value);
                setMessages([]);
              }}
              className="h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Pilih domain</option>
              {townList.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path
                d="M1 7C1 3.686 3.686 1 7 1C9.07 1 10.9 2.03 12.07 3.6M13 7C13 10.314 10.314 13 7 13C4.93 13 3.1 11.97 1.93 10.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path d="M12 1V4H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 13V10H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh konteks
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13 2C7.48 2 3 6.03 3 11C3 13.39 4.05 15.58 5.77 17.18L4 23L9.96 20.55C10.93 20.84 11.95 21 13 21C18.52 21 23 16.97 23 11C23 6.03 18.52 2 13 2Z"
                    stroke="#465fff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isSuperadmin && !selectedTownId
                  ? 'Pilih domain, lalu mulai tanya'
                  : 'Tanyakan seputar peraturan domain'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Tekan Enter untuk kirim, Shift+Enter untuk baris baru
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                  ${msg.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
              >
                {msg.role === 'user' ? (currentUser?.username?.[0]?.toUpperCase() ?? 'A') : 'AI'}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                AI
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Town label for admin */}
        {(activeTownName || (!isSuperadmin && currentUser?.townId)) && (
          <div className="px-4 pb-1 shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Domain: <span className="font-medium text-gray-600 dark:text-gray-300">
                {activeTownName ?? '—'}
              </span>
            </span>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isSuperadmin && !selectedTownId
                  ? 'Pilih domain dulu...'
                  : 'Ketik pertanyaan...'
              }
              disabled={loading || (isSuperadmin && !selectedTownId)}
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-colors min-h-[42px] max-h-40"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || (isSuperadmin && !selectedTownId)}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
              aria-label="Kirim"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 2.5L7 9M13.5 2.5L9 13.5L7 9M13.5 2.5L2.5 6.5L7 9" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
