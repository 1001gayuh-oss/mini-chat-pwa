'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquareCode, Lock, Mail, ArrowRight, Eye, EyeOff, User, CheckCircle2, X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [modalInfo, setModalInfo] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: '',
  });

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isSignUp) {
      // Proses Registrasi Akun Baru dengan menyertakan Display Name di metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        // Jika berhasil, masukkan juga data manual ke tabel profiles jika tabelnya aktif
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            display_name: displayName || email.split('@')[0],
          });
        }

        setModalInfo({
          show: true,
          title: 'Registrasi Berhasil!',
          message: 'Akun Anda berhasil dibuat. Silakan masuk atau periksa email jika verifikasi diaktifkan.',
        });
        setIsSignUp(false);
      }
    } else {
      // Proses Masuk (Login)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen max-w-md mx-auto p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border dark:border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400 shadow-inner">
            <MessageSquareCode className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? 'Daftar untuk mulai terhubung' : 'Masuk ke CiChat App Anda'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Input Nama / User ID (Hanya tampil saat mode Sign Up) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nama / User ID</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Email</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm border dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm border dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100"
              />
              {/* Tombol Ikon Mata untuk Lihat Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Memproses...' : isSignUp ? 'Daftar Sekarang' : 'Masuk'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar sekarang'}
          </button>
        </div>
      </div>

      {/* Modal Popup Kustom */}
      {modalInfo.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl shadow-2xl border dark:border-slate-700 p-6 flex flex-col items-center text-center relative">
            <button
              onClick={() => setModalInfo({ ...modalInfo, show: false })}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{modalInfo.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed mb-5">{modalInfo.message}</p>
            <button
              onClick={() => setModalInfo({ ...modalInfo, show: false })}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              Mengerti & Masuk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
