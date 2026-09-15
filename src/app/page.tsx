'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { supabase } from '@/lib/supabase';
import { Wifi, WifiOff, Send, Clock, CheckCheck, Users, MessageSquareCode } from 'lucide-react';

// Daftar Simulasi Pengguna (Multi-User Switcher)
const MOCK_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'User A', color: 'bg-blue-600', bubbleColor: 'bg-blue-600 text-white' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'User B', color: 'bg-emerald-600', bubbleColor: 'bg-emerald-600 text-white' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'User C', color: 'bg-purple-600', bubbleColor: 'bg-purple-600 text-white' },
];

const CONVERSATION_ID = 'room-chat-global-mvp';

export default function ChatApp() {
  const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Mengambil pesan dari penyimpanan lokal IndexedDB secara real-time
  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

  // Setup Supabase Realtime Listener (Sinkronisasi Dua Arah)
  useEffect(() => {
    const fetchCloudMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', CONVERSATION_ID);

      if (data) {
        for (const cloudMsg of data) {
          const exists = await db.messages.get(cloudMsg.id);
          if (!exists) {
            await db.messages.add({
              id: cloudMsg.id,
              conversation_id: cloudMsg.conversation_id,
              sender_id: cloudMsg.sender_id,
              content: cloudMsg.content,
              created_at: cloudMsg.created_at,
              sync_status: 'synced',
            });
          }
        }
      }
    };

    fetchCloudMessages();

    // Berlangganan perubahan real-time via WebSocket Supabase
    const channel = supabase
      .channel(`room:${CONVERSATION_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${CONVERSATION_ID}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const existing = await db.messages.get(newMsg.id);
          if (!existing) {
            await db.messages.add({
              id: newMsg.id,
              conversation_id: newMsg.conversation_id,
              sender_id: newMsg.sender_id,
              content: newMsg.content,
              created_at: newMsg.created_at,
              sync_status: 'synced',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Deteksi Jaringan Online / Offline
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxMessages();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fungsi Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessageId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newMessage: LocalMessage = {
      id: newMessageId,
      conversation_id: CONVERSATION_ID,
      sender_id: currentUserId,
      content: inputText,
      created_at: now,
      sync_status: isOnline ? 'synced' : 'pending',
    };

    await db.messages.add(newMessage);

    if (!isOnline) {
      await db.outbox.add({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: currentUserId,
        content: inputText,
        created_at: now,
        retry_count: 0,
      });
    } else {
      syncOutboxMessages();
    }

    setInputText('');
  };

  // Helper mendapatkan user aktif saat ini
  const currentUserObj = MOCK_USERS.find((u) => u.id === currentUserId) || MOCK_USERS[0];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header Aplikasi */}
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-gray-800 dark:text-white text-base">Mini Chat Simulation</h1>
          <p className="text-[10px] text-slate-400">Multi-User Live Sync</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {/* PANEL SIMULASI SWITCH USER */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <span>Simulasi Sebagai:</span>
        </div>
        <select
          value={currentUserId}
          onChange={(e) => setCurrentUserId(e.target.value)}
          className="text-xs font-semibold bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 border dark:border-slate-600 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 shadow-sm"
        >
          {MOCK_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquareCode className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Belum ada percakapan</p>
            <p className="text-xs mt-1 max-w-[200px]">Ubah dropdown simulasi user di atas untuk tes kirim pesan bergantian!</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            // Cari data pengirim asli berdasarkan sender_id pesan tersebut
            const senderInfo = MOCK_USERS.find((u) => u.id === msg.sender_id);
            const senderName = senderInfo ? senderInfo.name : 'User Lain';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] p-3.5 rounded-2xl text-sm shadow-sm transition-all ${
                    isMe
                      ? `${currentUserObj.bubbleColor} rounded-br-none`
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {/* Label Nama Pengirim (Hanya tampil di sisi kiri untuk user lain) */}
                  {!isMe && (
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                      {senderName}
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${isMe ? 'text-white/80' : 'text-slate-400'}`}>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe &&
                      (msg.sync_status === 'pending' ? (
                        <Clock className="w-3 h-3 animate-pulse text-amber-200" />
                      ) : (
                        <CheckCheck className="w-3 h-3 text-emerald-300" />
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
          placeholder={`Ketik pesan sebagai ${currentUserObj.name}...`}
          className="flex-1 px-4 py-2.5 text-sm border dark:border-slate-600 rounded-full focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition"
        />
        <button
          type="submit"
          className={`p-3 ${currentUserObj.color} text-white rounded-full hover:opacity-90 active:scale-95 transition shadow-md flex items-center justify-center`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
