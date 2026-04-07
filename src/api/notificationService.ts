import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import messaging from '@react-native-firebase/messaging';
import { getFCMToken, requestUserPermission } from '../config/firebase';


const getClient = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
};

const notificationService = {
    getNotifications: async () => {
        const client = await getClient();
        const response = await client.get('/notifications');
        return response.data;
    },

    markAsRead: async (notificationId: number) => {
        const client = await getClient();
        const response = await client.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const client = await getClient();
        const response = await client.post('/notifications/mark-all-read');
        return response.data;
    },

    // --- Push Notification Methods ---

    registerDeviceToken: async (token: string) => {
        try {
            const client = await getClient();
            // Assuming this endpoint will be created on the backend
            await client.post('/notifications/device-token', { token });
            console.log('Device token registered with backend');
        } catch (error) {
            console.error('Failed to register device token:', error);
        }
    },

    initializePushNotifications: async () => {
        const hasPermission = await requestUserPermission();
        if (hasPermission) {
            const token = await getFCMToken();
            if (token) {
                console.log('FCM Token:', token);
                await notificationService.registerDeviceToken(token);
            }

            // Listen for token refresh
            messaging().onTokenRefresh(async newToken => {
                console.log('Token refreshed:', newToken);
                await notificationService.registerDeviceToken(newToken);
            });

            // Foreground message listener
            const unsubscribe = messaging().onMessage(async remoteMessage => {
                console.log('✨ A new FCM message arrived in foreground!', JSON.stringify(remoteMessage, null, 2));
                // Chỉ log, không hiện popup để tránh làm phiền user
            });

            return unsubscribe;
        }
    }
};

export default notificationService;
