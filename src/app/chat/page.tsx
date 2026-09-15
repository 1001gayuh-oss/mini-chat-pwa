'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Wifi, 
  WifiOff, 
  Send, 
  Clock, 
  CheckCheck, 
  MessageSquareCode, 
  MoreVertical, 
  Search, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';

const CONVERSATION_ID = 'room-chat-global-mvp';

export default function ChatApp() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  // 1. Cek Sesi Pengguna yang Sedang Login
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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
      sender_id: user.id,
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

  // Filter pesan berdasarkan teks pencarian di halaman chat
  const filteredMessages = messages?.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors relative">
      
      {/* --- HEADER CHAT (DISELARASKAN DENGAN BERANDA) --- */}
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shadow-inner">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-gray-800 dark:text-white text-sm leading-tight">CiChat</h1>
            <p className="text-[10px] text-blue-500 truncate max-w-[120px]">{user?.email}</p>
          </div>
        </div>

        {/* Kanan: Indikator Jaringan + Ikon Titik Tiga (Menu Pengaturan) */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
              title="Menu Pengaturan"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu Titik Tiga */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 py-1.5 z-50">
                <button
                  onClick={() => { setShowMenu(false); alert('Fitur Profil Segera Hadir'); }}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Profil Saya</span>
                </button>
                <button
                  onClick={() => { setShowMenu(false); alert('Fitur Pengaturan Segera Hadir'); }}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Pengaturan Aplikasi</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- KOTAK PENCARIAN DI HALAMAN CHAT --- */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan dalam ruang ini..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 dark:text-gray-100 transition"
          />
        </div>
      </div>

      {/* Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages && filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquareCode className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Belum ada percakapan</p>
            <p className="text-xs mt-1 max-w-[200px]">Kirim pesan pertama dengan akun asli Anda!</p>
          </div>
        ) : (
          filteredMessages?.map((msg) => {
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
