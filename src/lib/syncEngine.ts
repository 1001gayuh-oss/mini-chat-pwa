import { db } from './db';
import { supabase } from './supabase';

let isSyncing = false;

export async function syncOutboxMessages() {
  if (isSyncing || !navigator.onLine) return;
  
  isSyncing = true;
  try {
    // Ambil semua pesan yang tertunda di outbox lokal
    const pendingItems = await db.outbox.toArray();
    if (pendingItems.length === 0) {
      isSyncing = false;
      return;
    }

    for (const item of pendingItems) {
      // Kirim data ke tabel messages di Supabase
      const { error } = await supabase.from('messages').insert({
        id: item.id,
        conversation_id: item.conversation_id,
        sender_id: item.sender_id,
        content: item.content,
        created_at: item.created_at,
      });

      if (!error) {
        // Jika sukses terkirim ke cloud, update status di database lokal menjadi 'synced'
        await db.messages.update(item.id, { sync_status: 'synced' });
        // Hapus dari antrean outbox karena sudah aman di cloud
        await db.outbox.delete(item.id);
      } else {
        console.error('Gagal menyinkronkan pesan:', error.message);
      }
    }
  } catch (err) {
    console.error('Terjadi kesalahan pada sync engine:', err);
  } finally {
    isSyncing = false;
  }
}
