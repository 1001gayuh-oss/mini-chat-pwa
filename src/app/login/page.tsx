'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquareCode, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isSignUp) {
      // Proses Registrasi Akun Baru
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        alert('Registrasi berhasil! Silakan masuk atau cek email Anda jika verifikasi diaktifkan.');
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
        // Jika sukses login, arahkan ke halaman utama chat
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto p-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border dark:border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400 shadow-inner">
            <MessageSquareCode className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? 'Daftar untuk mulai terhubung' : 'Masuk ke Mini Chat App Anda'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm border dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100"
              />
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
    </div>
  );
}