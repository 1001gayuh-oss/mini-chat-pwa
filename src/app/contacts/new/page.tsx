'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, AtSign, Save, CheckCircle2, X } from 'lucide-react';

export default function NewContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', isError: false });
  const router = useRouter();

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    // Cari user berdasarkan username
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (findError || !targetUser) {
      setModal({ show: true, title: 'Tidak Ditemukan', message: 'User ID / Username tersebut tidak terdaftar di CiChat.', isError: true });
      setLoading(false);
      return;
    }

    const aliasName = `${firstName} ${lastName}`.trim();

    // Simpan ke tabel contacts
    const { error: saveError } = await supabase.from('contacts').insert({
      user_id: session.user.id,
      contact_user_id: targetUser.id,
      alias_name: aliasName,
      phone: phone,
    });

    if (saveError) {
      setModal({ show: true, title: 'Gagal', message: 'Kontak sudah ada dalam direktori Anda.', isError: true });
    } else {
      setModal({ show: true, title: 'Sukses', message: 'Kontak berhasil ditambahkan!', isError: false });
      setTimeout(() => router.push('/contacts/select'), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/contacts/select')} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-800 dark:text-white text-sm">Tambah Kontak Baru</h1>
      </header>

      <form onSubmit={handleSaveContact} className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nama Depan</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Contoh: Budi"
            className="w-full px-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nama Belakang</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Contoh: Santoso"
            className="w-full px-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">User ID / Username</label>
          <div className="relative flex items-center">
            <AtSign className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username_teman"
              className="w-full pl-9 pr-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nomor Telepon</label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812-3456-7890"
              className="w-full pl-9 pr-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md flex items-center justify-center gap-2 mt-6"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan...' : 'Simpan Kontak'}</span>
        </button>
      </form>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{modal.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{modal.message}</p>
            <button onClick={() => setModal({ ...modal, show: false })} className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}