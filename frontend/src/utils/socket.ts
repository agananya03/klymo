import { io, Socket } from 'socket.io-client';

// Direct connection to backend (local dev)
const SOCKET_URL = 'http://localhost:8000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        // Initialize socket only when requested
        // Auto-connect is true by default, but we might want to control it
        // We will pass auth in connect logic or here if we have it globally
        socket = io(SOCKET_URL, {
            path: '/socket.io', // Matches backend mount
            autoConnect: false, // We connect manually after profile/verification
            transports: ['websocket', 'polling'],
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
