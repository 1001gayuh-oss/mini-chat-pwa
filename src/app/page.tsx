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
<div className="flex flex-col h-screen max-w-md mx-auto border shadow-lg bg-gray-50">
{/* Header */}
<header className="p-4 bg-white border-b flex justify-between items-center">
<h1 className="font-bold text-gray-800">Mini App Chat MVP</h1>
<div className="flex items-center gap-1 text-xs">
{isOnline ? (
<Wifi className="w-4 h-4 text-green-500" />
) : (
<WifiOff className="w-4 h-4 text-red-500" />
)}
<span>{isOnline ? 'Online' : 'Offline Mode'}</span>
</div>
</header>
{/* Messages List */}
<div className="flex-1 overflow-y-auto p-4 space-y-3">
{messages?.map((msg) => {
const isMe = msg.sender_id === CURRENT_USER_ID;
return (
<div
key={msg.id}
className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
>
<div
className={`max-w-[75%] p-3 rounded-2xl text-sm ${
isMe
? 'bg-blue-600 text-white rounded-br-none'
: 'bg-white text-gray-800 border rounded-bl-none'
}`}
>

<p>{msg.content}</p>
<div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
<span>
{new Date(msg.created_at).toLocaleTimeString([], {
hour: '2-digit',
minute: '2-digit',
})}
</span>
{isMe &&
(msg.sync_status === 'pending' ? (
<Clock className="w-3 h-3" />
) : (
<CheckCheck className="w-3 h-3" />
))}
</div>
</div>
</div>
);
})}
</div>
{/* Input Form */}
<form
onSubmit={handleSendMessage}
className="p-3 bg-white border-t flex gap-2 items-center"
>
<input
type="text"
value={inputText}
onChange={(e) => setInputText(e.target.value)}
placeholder={isOnline ? 'Tulis pesan...' : 'Tulis pesan (Offline)...'}

className="flex-1 px-4 py-2 text-sm border rounded-full focus:outline-none focus:border-
blue-500 text-gray-800"

/>
<button
type="submit"
className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
>
<Send className="w-4 h-4" />
</button>
</form>
</div>
);
}
