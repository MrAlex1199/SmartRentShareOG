import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
    // Map userId → Set of socket IDs (user can have multiple tabs)
    private userSockets = new Map<string, Set<string>>();

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token. Disconnecting.`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Store socket mapping
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            // Join personal room
            client.join(`user:${userId}`);
            client.data.userId = userId;

            this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        } catch (err) {
            this.logger.warn(`Connection rejected: invalid token (${err})`);
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
            this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        }
    }

    /**
     * Send notification to a specific user (all their tabs/devices)
     */
    sendNotificationToUser(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }

    /**
     * Client can mark notifications as read (handled by REST API, but socket confirms it)
     */
    @SubscribeMessage('mark_read')
    handleMarkRead(client: Socket, notificationId: string) {
        // The actual DB update is done via REST API
        // This just confirms back to client
        client.emit('mark_read_ack', { notificationId });
    }
}
