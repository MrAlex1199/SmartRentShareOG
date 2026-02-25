import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({
    cors: {
        origin: ['https://localhost:3005', 'http://localhost:3005', process.env.FRONTEND_URL || '*'],
        credentials: true,
    },
    namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    // Map userId → Set of socket IDs
    private userSockets = new Map<string, Set<string>>();

    constructor(
        private jwtService: JwtService,
        private messagesService: MessagesService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            client.join(`user:${userId}`);
            client.data.userId = userId;

            this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }

    // ─── Notification helpers ────────────────────────────────────────
    sendNotificationToUser(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }

    @SubscribeMessage('mark_read')
    handleMarkRead(client: Socket, notificationId: string) {
        client.emit('mark_read_ack', { notificationId });
    }

    // ─── Chat ────────────────────────────────────────────────────────

    /** Client joins a booking chat room */
    @SubscribeMessage('join_booking')
    handleJoinBooking(
        @MessageBody() bookingId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`booking:${bookingId}`);
        client.emit('joined_booking', { bookingId });
        this.logger.log(`Socket ${client.id} joined booking:${bookingId}`);
    }

    /** Client sends a chat message */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() payload: { bookingId: string; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data?.userId;
        if (!userId) return;

        try {
            const msg = await this.messagesService.createMessage(
                payload.bookingId,
                userId,
                payload.content,
            );

            // Broadcast to everyone in the booking room
            this.server.to(`booking:${payload.bookingId}`).emit('new_message', msg);
        } catch (err) {
            client.emit('message_error', { error: (err as Error).message });
        }
    }

    /** Send a chat message to all clients in a booking room (used internally) */
    broadcastToBooking(bookingId: string, event: string, payload: any) {
        this.server.to(`booking:${bookingId}`).emit(event, payload);
    }
}
