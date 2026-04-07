import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// socket URL usually is simply http://host:port without /api suffix
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
    socket: Socket | null = null;

    connect = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt_token');
            if (this.socket) {
                this.disconnect();
            }

            console.log('🔌 Connecting to socket:', SOCKET_URL);

            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                auth: {
                    token: token || '',
                },
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket Connected:', this.socket?.id);
            });

            this.socket.on('connect_error', (err) => {
                console.log('❌ Socket Connection Error:', err.message);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Socket Disconnected:', reason);
            });

        } catch (error) {
            console.error('Socket Auth Error:', error);
        }
    };

    disconnect = () => {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    };

    // Send exam deleted signal (for teacher)
    emitExamDeleted = (examId: number, classId: number | null, teacherId: number) => {
        // This is handled by REST API triggering backend emission usually, 
        // but if we emit from here it goes to server wrapper
        // Currently server listens to 'student-submit', etc.
    }
}

const socketService = new SocketService();
export default socketService;
