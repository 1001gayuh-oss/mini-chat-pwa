import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface OutboxItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  retry_count: number;
}

export class ChatDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('MiniChatLocalDB');
    this.version(1).stores({
      messages: 'id, conversation_id, created_at, sync_status',
      outbox: 'id, conversation_id, created_at',
    });
  }
}

export const db = new ChatDatabase();
