'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Phone, User, Info, Share2, Check } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({ username: '', about: '', phone: '' });
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [router]);

  const handleSharePhone = () => {
    if (profile.phone) {
      navigator.clipboard.writeText(profile.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert('Nomor telepon belum diatur.');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/')} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-800 dark:text-white text-sm">Profil Pengguna</h1>
      </header>

      <div className="p-6 flex flex-col items-center bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="relative mb-3">
          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-inner">
            {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'CI'}
          </div>
          <button 
            onClick={() => alert('Fitur ubah foto segera hadir')} 
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="font-bold text-gray-800 dark:text-white text-base">@{profile.username}</h2>
        <p className="text-xs text-slate-400">{user?.email}</p>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border dark:border-slate-700 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400">Tentang</p>
            <p className="text-xs text-gray-800 dark:text-gray-200">{profile.about || 'Halo, saya menggunakan CiChat!'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400">Telepon</p>
              <p className="text-xs text-gray-800 dark:text-gray-200">{profile.phone || 'Belum diatur'}</p>
            </div>
          </div>
          {/* Tombol + di ujung untuk membagikan nomor telepon */}
          <button
            onClick={handleSharePhone}
            className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl hover:bg-emerald-100 transition flex items-center gap-1 text-xs font-semibold"
            title="Bagikan Telepon"
          >
            {copied ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">+</span>}
          </button>
        </div>
      </div>
    </div>
  );
}