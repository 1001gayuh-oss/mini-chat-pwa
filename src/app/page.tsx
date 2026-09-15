'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { syncOutboxMessages } from '@/lib/syncEngine';
import { Wifi, WifiOff, Send, Clock, CheckCheck } from 'lucide-react';

const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';
const CONVERSATION_ID = '22222222-2222-2222-2222-222222222222';

export default function ChatApp() {
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Ambil data pesan dari IndexedDB
  const messages = useLiveQuery(
    () => db.messages.where({ conversation_id: CONVERSATION_ID }).sortBy('created_at'),
    []
  );

  // Deteksi Perubahan Status Jaringan
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncOutboxMessages();
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

    await db.messages.add(newMessage);

    if (!isOnline) {
      await db.outbox.add({
        id: newMessageId,
        conversation_id: CONVERSATION_ID,
        sender_id: CURRENT_USER_ID,
        content: inputText,
        created_at: now,
        retry_count: 0,
      });
    } else {
      syncOutboxMessages();
    }

    setInputText('');
  };

  return (
