import Dexie, { Table } from 'dexie';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface LocalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sync_status: SyncStatus;
}

export interface LocalOutboxItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  retry_count: number;
}

class MiniChatOfflineDB extends Dexie {
  messages!: Table;
  outbox!: Table;

  constructor() {
    super('MiniChatOfflineDB');
    this.version(1).stores({
      messages: 'id, conversation_id, sender_id, sync_status, created_at',
      outbox: 'id, conversation_id, created_at',
    });
  }
}

export const db = new MiniChatOfflineDB();