'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MoreVertical, 
  Search, 
  UserPlus, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function ContactsDirectoryPage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Cek Sesi Pengguna
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchContacts(session.user.id);
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  // Deteksi Jaringan Online / Offline
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

  // 2. Ambil Daftar Kontak Tersimpan
  const fetchContacts = async (userId: string) => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('alias_name', { ascending: true });

    if (!error && data) {
      setContacts(data);
    }
  };

  // Fungsi Memulai Chat Langsung dengan Kontak
  const startChatWithContact = async (contactUserId: string) => {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (newConv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: contactUserId }
      ]);
      router.push(`/chat?room=${newConv.id}`);
    }
  };

  // Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-400 text-sm">
        Memuat Direktori Kontak...
      </div>
    );
  }

  const filteredContacts = contacts.filter((c) =>
    c.alias_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 transition-colors relative">
      
      {/* --- HEADER DIREKTORI KONTAK --- */}
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm relative">
        <div className="flex items-center gap-2">
          {/* Tombol Kembali ke Beranda */}
          <button
            onClick={() => router.push('/')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-800 dark:text-white text-sm">Direktori Kontak</h1>
        </div>

        {/* Indikator Online & Menu Titik Tiga */}
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

      {/* --- AKSIS CEPAT KONTAK & AKSI TAMBAH --- */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 space-y-2">
        <div className="relative flex items-center mb-2">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak dalam direktori..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 dark:text-gray-100 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push('/contacts/new')}
            className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition hover:bg-emerald-100"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Kontak</span>
          </button>

          <button
            onClick={() => router.push('/contacts/select')}
            className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition hover:bg-blue-100"
          >
            <Users className="w-4 h-4" />
            <span>Pilih Kontak Chat</span>
          </button>
        </div>
      </div>

      {/* --- DAFTAR KONTAK TERDAFTAR --- */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Semua Kontak ({filteredContacts.length})
        </p>

        {filteredContacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Belum Ada Kontak</p>
            <p className="text-[11px] mt-1 max-w-[200px]">Ketuk "Tambah Kontak" untuk mendaftarkan teman baru ke direktori Anda.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => startChatWithContact(contact.contact_user_id)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition shadow-xs"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                {contact.alias_name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{contact.alias_name}</h3>
                <p className="text-[10px] text-slate-400 truncate">{contact.phone || 'Nomor HP belum diatur'}</p>
              </div>
              <div className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
