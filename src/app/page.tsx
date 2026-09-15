'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { Wifi, WifiOff, Send, Clock, CheckCheck } from 'lucide-react';

// DUMMY USER & CONVERSATION UNTUK MVP PROTOTYPE
const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';
const CONVERSATION_ID = '22222222-2222-2222-2222-222222222222';

export default function ChatApp() {
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Ambil data pesan langsung dari IndexedDB (Lokal)
  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

  // Deteksi Perubahan Status Jaringan
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxMessages(); // Langsung kirim pesan tertunda saat online
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fungsi Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newMessage: LocalMessage = {
      id: newMessageId,
      conversation_id: CONVERSATION_ID,
      sender_id: CURRENT_USER_ID,
      content: inputText,
      created_at: now,
      sync_status: isOnline ? 'synced' : 'pending',
    };

    // 1. Selalu tulis ke DB Lokal terlebih dahulu
    await db.messages.add(newMessage);

    if (!isOnline) {
      // Jika offline, masuk ke antrean Outbox
      await db.outbox.add({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: CURRENT_USER_ID,
        content: inputText,
        created_at: now,
        retry_count: 0,
      });
    } else {
      // Jika online, coba kirim ke cloud
      syncOutboxMessages();
    }

    setInputText('');
  };

  return (