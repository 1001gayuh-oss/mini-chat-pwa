'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, 
  Search, 
  MessageSquare, 
  Users, 
  LogOut, 
  Settings, 
  User, 
  Plus, 
  ChevronRight,
  Wifi,
  WifiOff,
  UserPlus,
  FolderPlus
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchConversations(session.user.id);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations (id, created_at)')
      .eq('user_id', userId);

    if (!error && data) {
      const formattedRooms = data.map((item: any) => ({
        id: item.conversations.id,
        name: `Ruang Obrolan (${item.conversations.id.substring(0, 6)})`,
        lastMessage: 'Ketuk untuk mulai percakapan...',
        time: new Date(item.conversations.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setConversations(formattedRooms);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-400 text-sm">
        Memuat Beranda...
      </div>
    );
  }

  const filteredConversations = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors relative">
      
      {/* --- HEADER BERANDA --- */}
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm relative">
        <h1 className="font-bold text-gray-800 dark:text-white text-lg tracking-wide">CiChat</h1>

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
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 py-1.5 z-50">
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Profil Saya</span>
                </button>
                <button
                  onClick={() => router.push('/contacts')}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span>Kontak & Pilih Kontak</span>
                </button>
                <button
                  onClick={() => router.push('/groups')}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <FolderPlus className="w-4 h-4 text-purple-500" />
                  <span>Pusat Grup</span>
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Pengaturan</span>
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

      {/* --- PENCARIAN --- */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari riwayat atau kontak..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* --- INBOX CHAT --- */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Belum ada riwayat chat</p>
            <p className="text-xs mt-1 max-w-[220px]">Ketuk tombol tambah untuk mulai membuat ruang obrolan baru.</p>
          </div>
        ) : (
          filteredConversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => router.push(`/chat?room=${chat.id}`)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition shadow-xs"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-slate-400 shrink-0">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{chat.lastMessage}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* --- FAB --- */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={() => router.push('/contacts/select')}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition"
          title="Pilih Kontak / Chat Baru"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
