'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Search, Users, FolderPlus, Plus, ChevronRight, Wifi, WifiOff, Shield, Link, Settings } from 'lucide-react';

export default function GroupsPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        fetchGroups();
      }
    };
    checkSession();
  }, [router]);

  const fetchGroups = async () => {
    const { data, error } = await supabase.from('groups').select('*');
    if (!error && data) setGroups(data);
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-800 dark:text-white text-sm">Pusat Grup</h1>
        </div>
      </header>

      {/* --- GRID 2 BAGIAN: KIRI (TAMBAH SUB-GRUP) & KANAN (PENCARIAN) --- */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push('/groups/create?type=sub')}
          className="py-2 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:bg-purple-100"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Tambah Sub-Grup</span>
        </button>

        <button
          onClick={() => router.push('/groups/create?type=main')}
          className="py-2 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          <span>Grup Pusat</span>
        </button>
      </div>

      {/* Kotak Pencarian */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pusat grup atau sub-grup..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border rounded-xl"
          />
        </div>
      </div>

      {/* Daftar Grup */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredGroups.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-400">Belum ada pusat grup atau sub-grup. Buat sekarang!</div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => router.push(`/chat?room=${group.id}`)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 rounded-xl border cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{group.name}</h3>
                <p className="text-[10px] text-slate-400 truncate">{group.description || 'Tidak ada deskripsi'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}