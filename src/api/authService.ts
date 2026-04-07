import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

// Hardcode base URL to be absolutely sure
const BASE_URL = 'http://192.168.43.25:3000/api';

console.log('AuthService: Creating LOCAL axios instance');

const localClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authService = {
    login: async (email: string, password: string) => {
        try {
            console.log('Login attempt LOCAL:', { email, url: API_ENDPOINTS.LOGIN });
            // Mobile luôn gửi rememberMe: true (user mobile không muốn đăng nhập lại)
            const response = await localClient.post(API_ENDPOINTS.LOGIN, { 
                email, 
                password, 
                rememberMe: true 
            });
            console.log('Login success data:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Login error detail:', error.message || error);
            if (error.response) {
                console.error('Server response:', error.response.status, error.response.data);
            }
            throw error;
        }
    },

    register: async (userData: any) => {
        const response = await localClient.post(API_ENDPOINTS.REGISTER, userData);
        return response.data;
    },

    getProfile: async () => {
        const token = await AsyncStorage.getItem('jwt_token');
        console.log('API Request: GET /user/profile');
        console.log('Auth Header:', token ? `Bearer ${token.substring(0, 10)}...` : 'None');
        const response = await localClient.get(API_ENDPOINTS.PROFILE, {
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            }
        });
        return response.data;
    },

    updateProfile: async (userData: { fullName?: string; phone?: string; dob?: string; gender?: string }) => {
        const token = await AsyncStorage.getItem('jwt_token');
        const response = await localClient.post('/user/profile/update', userData, {
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            }
        });
        return response.data;
    },

    uploadAvatar: async (imageUri: string) => {
        const token = await AsyncStorage.getItem('jwt_token');

        // Create FormData for image upload
        const formData = new FormData();
        formData.append('avatar', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
        } as any);

        const response = await localClient.post('/user/profile/avatar', formData, {
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // Refresh token - lấy JWT mới bằng refresh token
    refreshToken: async (): Promise<{ token: string; refreshToken: string; role: string } | null> => {
        try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (!refreshToken) {
                console.log('No refresh token found');
                return null;
            }

            console.log('🔄 Attempting to refresh token...');
            const response = await localClient.post(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken });
            
            if (response.data && response.data.token) {
                // Lưu token mới
                await AsyncStorage.setItem('jwt_token', response.data.token);
                // Lưu refresh token mới (rotation)
                if (response.data.refreshToken) {
                    await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
                }
                console.log('✅ Token refreshed successfully');
                return response.data;
            }
            return null;
        } catch (error: any) {
            console.error('❌ Token refresh failed:', error.message);
            // Xóa refresh token lỗi
            await AsyncStorage.removeItem('refresh_token');
            return null;
        }
    },

    // Logout - thu hồi refresh token trên server
    serverLogout: async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
                const token = await AsyncStorage.getItem('jwt_token');
                await localClient.post(API_ENDPOINTS.LOGOUT, 
                    { refreshToken },
                    { headers: { Authorization: token ? `Bearer ${token}` : '' } }
                );
                console.log('🔒 Server logout - Refresh token revoked');
            }
        } catch (error: any) {
            console.warn('Server logout failed (non-critical):', error.message);
        }
    }
};

export default authService;
