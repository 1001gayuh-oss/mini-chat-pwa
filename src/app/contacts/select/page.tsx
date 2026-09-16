'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Search, UserPlus, Users, User, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';

export default function SelectContactPage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        fetchContacts(session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const fetchContacts = async (userId: string) => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      setContacts(data);
    }
  };

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

  const filteredContacts = contacts.filter(c => c.alias_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-800 dark:text-white text-sm">Pilih Kontak</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Aksi Cepat: Grup Baru diarahkan ke /groups & Kontak Baru */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 space-y-2">
        <div className="relative flex items-center mb-2">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border rounded-xl"
          />
        </div>

        {/* Tombol Grup Baru diarahkan ke /groups */}
        <button 
          onClick={() => router.push('/groups')} 
          className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-xs font-semibold text-blue-600 dark:text-blue-400"
        >
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span>Grup Baru</span>
        </button>

        <button 
          onClick={() => router.push('/contacts/new')} 
          className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-xs font-semibold text-emerald-600 dark:text-emerald-400"
        >
          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <span>Kontak Baru</span>
        </button>
      </div>

      {/* Daftar Kontak Tersimpan */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontak di CiChat</p>
        {filteredContacts.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-400">Belum ada kontak ditambahkan. Ketuk "Kontak Baru".</div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => startChatWithContact(contact.contact_user_id)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer border"
            >
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                {contact.alias_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-800 dark:text-gray-100">{contact.alias_name}</h3>
                <p className="text-[10px] text-slate-400">{contact.phone || 'Tidak ada telepon'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
