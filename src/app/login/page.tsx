'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquareCode, Lock, Mail, ArrowRight, Eye, EyeOff, User, CheckCircle2, X, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Popup Kustom
  const [modalInfo, setModalInfo] = useState<{ show: boolean; title: string; message: string; isError?: boolean }>({
    show: false,
    title: '',
    message: '',
    isError: false,
  });

  const router = useRouter();

  // Fungsi Cek Ketersediaan Username (Hanya Huruf & Angka, Unique Check)
  const handleCheckUsername = async () => {
    if (!username.trim()) {
      setModalInfo({ show: true, title: 'Perhatian', message: 'Silakan isi username terlebih dahulu.', isError: true });
      return;
    }

    // Validasi regex: hanya huruf dan angka
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(username)) {
      setModalInfo({ show: true, title: 'Format Salah', message: 'User ID hanya boleh menggunakan huruf dan angka tanpa spasi atau simbol!', isError: true });
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (data) {
      setModalInfo({ show: true, title: 'Tidak Tersedia', message: `Username "${username}" sudah digunakan pengguna lain. Pilih nama lain.`, isError: true });
    } else {
      setModalInfo({ show: true, title: 'Tersedia!', message: `Username "${username}" dapat digunakan.`, isError: false });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const regex = /^[a-zA-Z0-9]+$/;
      if (!regex.test(username)) {
        setModalInfo({ show: true, title: 'Format Salah', message: 'User ID hanya boleh menggunakan huruf dan angka.', isError: true });
        setLoading(false);
        return;
      }

      // 1. Sign Up Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (error) {
        setModalInfo({ show: true, title: 'Gagal Daftar', message: error.message, isError: true });
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username,
          });
        }
        setModalInfo({
          show: true,
          title: 'Registrasi Berhasil!',
          message: 'Akun Anda berhasil dibuat. Silakan masuk.',
          isError: false,
        });
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setModalInfo({ show: true, title: 'Gagal Masuk', message: error.message, isError: true });
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

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">User ID / Username (Huruf & Angka)</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: budisantoso123"
                  className="w-full pl-10 pr-16 py-2.5 text-sm border dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  className="absolute right-2 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-200 text-[10px] font-bold rounded-lg transition"
                >
                  Cek
                </button>
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition"
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

      {/* --- POPUP MODAL KUSTOM SERAGAM --- */}
      {modalInfo.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl shadow-2xl border dark:border-slate-700 p-6 flex flex-col items-center text-center relative">
            <button
              onClick={() => setModalInfo({ ...modalInfo, show: false })}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner ${modalInfo.isError ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {modalInfo.isError ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{modalInfo.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed mb-5">{modalInfo.message}</p>
            <button
              onClick={() => setModalInfo({ ...modalInfo, show: false })}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-semibold transition shadow-md ${modalInfo.isError ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
