import { io, Socket } from 'socket.io-client';

// Use the same API URL for sockets
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            path: '/socket.io',
            autoConnect: false,
            transports: ['websocket', 'polling'],
            secure: true, // Use secure connection for Railway
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};