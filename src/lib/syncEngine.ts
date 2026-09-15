import { db } from './db';
import { supabase } from './supabase';

export async function syncOutboxMessages() {
  if (!navigator.onLine) return;

  const pendingItems = await db.outbox.toArray();
  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    try {
      // 1. Kirim ke Supabase Cloud
      const { error } = await supabase.from('messages').insert({
        id: item.id,
        conversation_id: item.conversation_id,
        sender_id: item.sender_id,
        content: item.content,
        created_at: item.created_at,
      });

      if (!error) {
        // 2. Jika sukses, ubah status lokal menjadi 'synced' dan hapus dari antrean
        await db.messages.update(item.id, { sync_status: 'synced' });
        await db.outbox.delete(item.id);
      }
    } catch (err) {
      console.error('Gagal menyinkronkan pesan:', err);
    }
  }
}