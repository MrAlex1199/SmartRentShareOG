'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';

interface MessageDoc {
  _id: string;
  content: string;
  messageType: 'text' | 'image' | 'system';
  isRead: boolean;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    pictureUrl?: string;
  };
}

interface BookingMeta {
  _id: string;
  item: { title: string; images: string[] };
  renter: { _id: string; displayName: string; pictureUrl?: string };
  owner: { _id: string; displayName: string; pictureUrl?: string };
  status: string;
}

function Avatar({ user, size = 8 }: { user: { displayName: string; pictureUrl?: string }; size?: number }) {
  if (user.pictureUrl) {
    return <img src={user.pictureUrl} alt={user.displayName} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary flex items-center justify-center flex-shrink-0`}>
      <span className="text-sm font-bold text-gray-900">{user.displayName.charAt(0)}</span>
    </div>
  );
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = Cookies.get('token');

  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [booking, setBooking] = useState<BookingMeta | null>(null);
  const [myId, setMyId] = useState('');
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load booking info + history
  const loadData = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [meRes, bookingRes, msgRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${bookingId}`, { headers }),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setMyId(me._id);
      }
      if (bookingRes.ok) setBooking(await bookingRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
    } finally {
      setLoading(false);
    }
  }, [bookingId, token, router]);

  // Setup Socket.io
  useEffect(() => {
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
    const socket: Socket = io(apiBase, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_booking', bookingId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: MessageDoc) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('message_error', ({ error }: { error: string }) => {
      console.error('Chat error:', error);
    });

    socketRef.current = socket;
    loadData();

    return () => {
      socket.disconnect();
    };
  }, [bookingId, token, loadData]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    // Emit via socket first (fast path)
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { bookingId, content: text });
    } else {
      // Fallback: REST API
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${bookingId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: text }),
        });
        await loadData();
      } catch { /* ignore */ }
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = booking ? (myId === booking.renter._id ? booking.owner : booking.renter) : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 safe-top">
        <button
          onClick={() => router.push(`/bookings/${bookingId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {otherUser && (
          <>
            <Avatar user={otherUser} size={10} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{otherUser.displayName}</p>
              {booking && (
                <p className="text-xs text-gray-500 truncate">{booking.item.title}</p>
              )}
            </div>
          </>
        )}

        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
          title={connected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'} />
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-gray-500 font-medium">ยังไม่มีข้อความ</p>
            <p className="text-sm text-gray-400 mt-1">เริ่มสนทนากับ{otherUser?.displayName ?? 'คู่สัญญา'}ได้เลย</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender._id === myId;
          const prevMsg = messages[idx - 1];
          const showDateDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
          const showAvatar = !isMe && (!messages[idx + 1] || messages[idx + 1].sender._id !== msg.sender._id);
          const sameSenderAsPrev = prevMsg && prevMsg.sender._id === msg.sender._id;

          return (
            <div key={msg._id}>
              {/* Date divider */}
              {showDateDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(msg.createdAt), 'd MMMM yyyy', { locale: th })}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* Message bubble */}
              <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${sameSenderAsPrev && !showDateDivider ? 'mt-0.5' : 'mt-3'}`}>
                {/* Left avatar placeholder */}
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && <Avatar user={msg.sender} size={8} />}
                  </div>
                )}

                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.messageType === 'system' ? (
                    <div className="text-xs text-center text-gray-400 bg-gray-100 px-3 py-1 rounded-full mx-auto">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMe
                        ? 'bg-primary text-gray-900 rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                    >
                      {msg.content}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {formatDistanceToNow(new Date(msg.createdAt), { locale: th, addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            maxLength={1000}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
