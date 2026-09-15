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
  LogOut,
  ArrowLeft,
  Keyboard,
  Smile,
  Hash,
  AtSign
} from 'lucide-react';

const CONVERSATION_ID = 'room-chat-global-mvp';

export default function ChatApp() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  // State untuk laci melayang Keyboard / Ekspresi di bawah
  const [activeBottomDrawer, setActiveBottomDrawer] = useState<'none' | 'keyboard' | 'expression'>('none');
  
  const router = useRouter();

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

  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

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
          { event: 'INSERT', schema: 'public', table: 'messages' },
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

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); syncOutboxMessages(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
    setActiveBottomDrawer('none');
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-400 text-sm">
        Memuat sesi akun...
      </div>
    );
  }

  const filteredMessages = messages?.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors relative overflow-hidden">
      
      {/* --- HEADER CHAT --- */}
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-2">
          {/* Tombol Kembali ke Halaman Beranda */}
          <button
            onClick={() => router.push('/')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shadow-inner">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-gray-800 dark:text-white text-xs leading-tight">CiChat Room</h1>
            <p className="text-[9px] text-blue-500 truncate max-w-[100px]">{user?.email}</p>
          </div>
        </div>

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

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 py-1.5 z-50">
                <button
                  onClick={() => { setShowMenu(false); alert('Fitur Profil'); }}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Profil Saya</span>
                </button>
                <button
                  onClick={() => { setShowMenu(false); alert('Pengaturan'); }}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Pengaturan Aplikasi</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- KOTAK PENCARIAN PESAN --- */}
      <div className="p-2.5 bg-white dark:bg-slate-800 border-b dark:border-slate-700 z-10">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan dalam ruang ini..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 dark:text-gray-100 transition"
          />
        </div>
      </div>

      {/* --- DAFTAR PESAN --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filteredMessages && filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquareCode className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Belum ada percakapan</p>
          </div>
        ) : (
          filteredMessages?.map((msg) => {
            const isMe = msg.sender_id === user?.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[78%] p-3 rounded-2xl text-xs shadow-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border dark:border-slate-700 rounded-bl-none'
                }`}>
                  {!isMe && (
                    <p className="text-[9px] font-bold text-blue-500 mb-1">{msg.sender_id.substring(0, 6)}...</p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-white/80' : 'text-slate-400'}`}>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (msg.sync_status === 'pending' ? <Clock className="w-2.5 h-2.5 animate-pulse" /> : <CheckCheck className="w-2.5 h-2.5 text-emerald-300" />)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- BAGIAN KETIK CHAT MELAYANG (FLOATING INPUT & DYNAMIC DRAWER) --- */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t dark:border-slate-700 shadow-2xl z-30">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          
          {/* Tombol Toggle Dinamis Pojok Kiri (Keyboard <-> Ekspresi) */}
          <button
            type="button"
            onClick={() => {
              if (activeBottomDrawer === 'keyboard') {
                setActiveBottomDrawer('expression');
              } else if (activeBottomDrawer === 'expression') {
                setActiveBottomDrawer('keyboard');
              } else {
                setActiveBottomDrawer('keyboard');
              }
            }}
            className="p-2.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700 rounded-full transition"
            title={activeBottomDrawer === 'keyboard' ? 'Buka Ekspresi' : 'Buka Pintasan Keyboard'}
          >
            {activeBottomDrawer === 'keyboard' ? (
              <Smile className="w-5 h-5 text-amber-500" />
            ) : activeBottomDrawer === 'expression' ? (
              <Keyboard className="w-5 h-5 text-blue-500" />
            ) : (
              <Keyboard className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setActiveBottomDrawer('none')}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-2.5 text-xs border dark:border-slate-600 rounded-full focus:outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition shadow-inner"
          />

          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full active:scale-95 transition shadow-md flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* --- LACI PINTASAN KEBWAH (KEYBOARD / EKSPRESI) --- */}
        {activeBottomDrawer === 'keyboard' && (
          <div className="mt-3 pt-3 border-t dark:border-slate-700 grid grid-cols-4 gap-2 animate-fadeIn">
            <button type="button" onClick={() => setInputText(prev => prev + ' 👍')} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs hover:bg-blue-50 text-center font-medium">👍 Setuju</button>
            <button type="button" onClick={() => setInputText(prev => prev + ' OTW')} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs hover:bg-blue-50 text-center font-medium">🚀 OTW</button>
            <button type="button" onClick={() => setInputText(prev => prev + ' Mohon tunggu sebentar ya.')} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs hover:bg-blue-50 text-center font-medium">⏳ Sebentar</button>
            <button type="button" onClick={() => setInputText(prev => prev + ' Terima kasih!')} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs hover:bg-blue-50 text-center font-medium">🙏 Terima Kasih</button>
          </div>
        )}

        {activeBottomDrawer === 'expression' && (
          <div className="mt-3 pt-3 border-t dark:border-slate-700 flex justify-around text-xl animate-fadeIn">
            {['😀', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '😎'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText(prev => prev + ' ' + emoji)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
