'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Users, Shield, CheckCircle2, X } from 'lucide-react';

function CreateGroupContent() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentGroupId, setParentGroupId] = useState('');
  const [mainGroups, setMainGroups] = useState<any[]>([]);
  const [isAdminCanEdit, setIsAdminCanEdit] = useState(true);
  const [notify, setNotify] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [inviteLink, setInviteLink] = useState('cichat.app/join/' + Math.random().toString(36).substring(2, 9));
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '' });

  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'main'; // 'main' atau 'sub'

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        if (type === 'sub') {
          fetchMainGroups();
        }
      }
    };
    checkSession();
  }, [router, type]);

  const fetchMainGroups = async () => {
    const { data } = await supabase.from('groups').select('*').is('parent_group_id', null);
    if (data) setMainGroups(data);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data: newGroup, error } = await supabase.from('groups').insert({
      name,
      description,
      parent_group_id: type === 'sub' && parentGroupId ? parentGroupId : null,
      created_by: user.id,
      invite_link: inviteLink,
      settings: {
        admin_can_edit: isAdminCanEdit,
        notify: notify,
        is_public: isPublic
      }
    }).select().single();

    if (error) {
      setModal({ show: true, title: 'Gagal', message: error.message });
    } else {
      await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: 'admin'
      });

      setModal({ show: true, title: 'Berhasil!', message: `${type === 'sub' ? 'Sub-Grup' : 'Pusat Grup'} berhasil dibuat.` });
      setTimeout(() => router.push('/groups'), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border shadow-2xl bg-slate-50 dark:bg-slate-900 relative">
      <header className="p-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/groups')} className="p-2 text-slate-600 dark:text-slate-300 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-800 dark:text-white text-sm">
          {type === 'sub' ? 'Buat Sub-Grup Baru' : 'Buat Pusat Grup Baru'}
        </h1>
      </header>

      <form onSubmit={handleCreateGroup} className="p-4 space-y-4 flex-1 overflow-y-auto pb-16">
        {type === 'sub' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Pilih Grup Pusat (Induk)</label>
            <select
              value={parentGroupId}
              onChange={(e) => setParentGroupId(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">-- Pilih Grup Pusat --</option>
              {mainGroups.map(mg => (
                <option key={mg.id} value={mg.id}>{mg.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <button type="button" onClick={() => alert('Fitur ubah foto grup')} className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Ubah Foto Grup</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nama Grup</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'sub' ? 'Contoh: Kelas 1A' : 'Contoh: Kelas Utama'}
            className="w-full px-4 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Deskripsi Grup</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tuliskan tujuan atau aturan grup..."
            rows={2}
            className="w-full px-4 py-2 text-xs border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border dark:border-slate-700 space-y-3">
          <h3 className="font-bold text-xs text-gray-800 dark:text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Pengaturan Hak Akses (Admin & Anggota)</span>
          </h3>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Admin dapat ubah info & setujui anggota</span>
            <input type="checkbox" checked={isAdminCanEdit} onChange={(e) => setIsAdminCanEdit(e.target.checked)} className="rounded" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Aktifkan Notifikasi Grup</span>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="rounded" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Grup dapat dilihat publik (Publik)</span>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Link Tautan Undangan Grup</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border rounded-xl text-slate-500 font-mono"
            />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Tautan disalin!'); }}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition"
            >
              Salin
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md flex items-center justify-center gap-2 mt-4"
        >
          <span>{loading ? 'Memproses...' : type === 'sub' ? 'Buat Sub-Grup' : 'Buat Pusat Grup'}</span>
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

export default function CreateGroupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50 text-xs text-slate-400">Memuat halaman...</div>}>
      <CreateGroupContent />
    </Suspense>
  );
}
