'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { Wifi, WifiOff, Send, Clock, CheckCheck, MessageSquareCode } from 'lucide-react';

const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';
const CONVERSATION_ID = '22222222-2222-2222-2222-222222222222';

export default function ChatApp() {
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Mengambil pesan dari penyimpanan lokal IndexedDB secara real-time
  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

  // Mendeteksi status internet pengguna (Online / Offline)
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxMessages(); // Otomatis sinkronisasi saat internet nyala
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fungsi saat tombol Kirim ditekan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessageId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newMessage: LocalMessage = {
      id: newMessageId,
      conversation_id: CONVERSATION_ID,
      sender_id: CURRENT_USER_ID,
      content: inputText,
      created_at: now,
      sync_status: isOnline ? 'synced' : 'pending',
    };

    // 1. Simpan ke database lokal HP (IndexedDB) terlebih dahulu (Prinsip Local-First)
    await db.messages.add(newMessage);

    // 2. Jika offline, masukkan ke antrean (outbox) agar nanti dikirim ulang jika online
    if (!isOnline) {
      await db.outbox.add({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: CURRENT_USER_ID,
        content: inputText,
        created_at: now,
        retry_count: 0,
      });
    } else {
      syncOutboxMessages();
    }

    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header Aplikasi */}
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-gray-800 dark:text-white text-base">Mini App Chat</h1>
          <p className="text-[10px] text-slate-400">Local-First Architecture</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>
      </header>

      {/* Daftar Pesan atau Tampilan Kosong (Empty State) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquareCode className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Belum ada percakapan</p>
            <p className="text-xs mt-1 max-w-[200px]">Kirim pesan pertamamu sekarang, aman meskipun tanpa internet!</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.sender_id === CURRENT_USER_ID;
            return (
              <div
                key={msg.id}
                className={`flex flex-col animate-fadeIn ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] p-3.5 rounded-2xl text-sm shadow-sm transition-all ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {/* Indikator Status Pesan Lokal vs Cloud */}
                    {isMe &&
                      (msg.sync_status === 'pending' ? (
                        <Clock className="w-3 h-3 animate-pulse text-amber-200" title="Menunggu sinkronisasi..." />
                      ) : (
                        <CheckCheck className="w-3 h-3 text-emerald-300" title="Terkirim" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Input Pesan */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2 items-center shadow-lg"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isOnline ? 'Tulis pesan...' : 'Kirim pesan offline (masuk antrean)...'}
          className="flex-1 px-4 py-2.5 text-sm border dark:border-slate-600 rounded-full focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition"
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 transition shadow-md flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
