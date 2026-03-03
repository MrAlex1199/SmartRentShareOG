'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface NotificationPayload {
    _id: string;
    type: string;
    title: string;
    message: string;
    bookingId?: string;
    isRead: boolean;
    createdAt: string;
}

interface UseSocketReturn {
    isConnected: boolean;
    lastNotification: NotificationPayload | null;
}

export function useSocket(): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) return;

        // Force http:// — wss:// fails on localhost without SSL cert
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const apiUrl = rawUrl.replace('/api', '').replace('https://', 'http://');

        const socket = io(apiUrl, {
            auth: { token },
            transports: ['polling', 'websocket'], // polling first avoids SSL issue
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('notification', (data: NotificationPayload) => {
            setLastNotification(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return { isConnected, lastNotification };
}
