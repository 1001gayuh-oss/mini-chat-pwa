'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Shield, UserX, Bell, Share2, ChevronRight, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [router]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/')} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-800 dark:text-white text-sm">Pengaturan Aplikasi</h1>
      </header>

      {/* Klik bagian profil mengarah ke halaman profil */}
      <div 
        onClick={() => router.push('/profile')}
        className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition"
      >
        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
          {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'CI'}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-xs text-gray-800 dark:text-white">@{profile.username || 'Pengguna'}</h2>
          <p className="text-[10px] text-slate-400">Ketuk untuk melihat profil lengkap</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>

      <div className="p-2 space-y-1 flex-1 overflow-y-auto">
        <button onClick={() => alert('Halaman Akun')} className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 border text-xs font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-3"><User className="w-4 h-4 text-blue-500" /><span>Akun</span></div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button onClick={() => alert('Halaman Privasi')} className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 border text-xs font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-emerald-500" /><span>Privasi</span></div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button onClick={() => alert('Halaman Daftar Blokir')} className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 border text-xs font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-3"><UserX className="w-4 h-4 text-rose-500" /><span>Daftar Blokir</span></div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button onClick={() => alert('Halaman Notifikasi')} className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 border text-xs font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-3"><Bell className="w-4 h-4 text-amber-500" /><span>Notifikasi</span></div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button onClick={() => { navigator.clipboard.writeText(window.location.origin); alert('Link undangan disalin!'); }} className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 border text-xs font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-3"><Share2 className="w-4 h-4 text-purple-500" /><span>Tautan Undang Teman</span></div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}