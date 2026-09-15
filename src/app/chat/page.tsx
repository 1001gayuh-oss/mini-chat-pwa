'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Send, Clock, CheckCheck, LogOut, MessageSquareCode } from 'lucide-react';

const CONVERSATION_ID = 'room-chat-global-mvp';

export default function ChatApp() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  // 1. Cek Sesi Pengguna yang Sedang Login
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Jika belum login, lempar ke halaman login
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoadingAuth(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Ambil pesan dari IndexedDB secara reaktif
  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

  // Realtime Sync Listener Dua Arah
  useEffect(() => {
    if (!user) return;
    let channel: any;

    const initRealtimeSync = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', CONVERSATION_ID)
        .order('created_at', { ascending: true });

      if (!error && data) {
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

      channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const newMsg = payload.new as any;
            if (newMsg && newMsg.conversation_id === CONVERSATION_ID) {
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
          }
        )
        .subscribe();
    };

    initRealtimeSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

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

  // Fungsi Keluar (Logout)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Fungsi Kirim Pesan Menggunakan ID Auth Asli
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const newMessageId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newMessage: LocalMessage = {
      id: newMessageId,
      conversation_id: CONVERSATION_ID,
      sender_id: user.id, // Menggunakan ID asli dari akun Supabase Auth
      content: inputText,
      created_at: now,
      sync_status: isOnline ? 'synced' : 'pending',
    };

    await db.messages.add(newMessage);

    if (!isOnline) {
      await db.outbox.add({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: user.id,
        content: inputText,
        created_at: now,
        retry_count: 0,
      });
    } else {
      const { error } = await supabase.from('messages').insert({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: user.id,
        content: inputText,
        created_at: now,
      });

      if (error) {
        console.error('Gagal mengirim ke cloud:', error.message);
        await db.outbox.add({
          id: newMessageId,
          conversation_id: CONVERSATION_ID,
          sender_id: user.id,
          content: inputText,
          created_at: now,
          retry_count: 0,
        });
      } else {
        await db.messages.update(newMessageId, { sync_status: 'synced' });
      }
    }

    setInputText('');
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-400 text-sm">
        Memuat sesi akun...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header dengan Info Akun Asli */}
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-gray-800 dark:text-white text-base">CiChat</h1>
          <p className="text-[10px] text-blue-500 truncate max-w-[160px]">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquareCode className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Belum ada percakapan</p>
            <p className="text-xs mt-1 max-w-[200px]">Kirim pesan pertama dengan akun asli Anda!</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.sender_id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] p-3.5 rounded-2xl text-sm shadow-sm transition-all ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                      {msg.sender_id.substring(0, 6)}...
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
          placeholder="Ketik pesan..."
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
