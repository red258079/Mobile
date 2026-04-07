import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../api/authService';

interface User {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    avatar?: string;
    phone?: string;
    dob?: string;
    gender?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const token = await AsyncStorage.getItem('jwt_token');
            console.log('LoadStorage: Token found:', token ? 'Yes' : 'No');
            const savedUser = await AsyncStorage.getItem('user_info');

            let isValidSession = false;

            if (token && savedUser) {
                // Load from storage instantly
                setUser(JSON.parse(savedUser));
                isValidSession = true;

                // Then try to refresh in background
                try {
                    const profileResponse = await authService.getProfile();
                    if (profileResponse && profileResponse.user) {
                        setUser(profileResponse.user);
                        AsyncStorage.setItem('user_info', JSON.stringify(profileResponse.user));
                    } else if (profileResponse) {
                        // Fallback in case it returns user directly (should not happen with new code but safe)
                        setUser(profileResponse);
                        AsyncStorage.setItem('user_info', JSON.stringify(profileResponse));
                    }
                } catch (err: any) {
                    console.log('Background profile refresh failed');
                    if (err.response && err.response.status === 401) {
                        console.log('Token invalid, trying refresh token...');
                        
                        // Thử refresh token trước khi logout
                        const refreshResult = await authService.refreshToken();
                        if (refreshResult && refreshResult.token) {
                            console.log('✅ Token refreshed via refresh token!');
                            // Retry profile fetch với token mới
                            try {
                                const profileResponse = await authService.getProfile();
                                if (profileResponse && profileResponse.user) {
                                    setUser(profileResponse.user);
                                    AsyncStorage.setItem('user_info', JSON.stringify(profileResponse.user));
                                }
                            } catch (retryErr) {
                                console.log('Profile fetch failed even after refresh, logging out');
                                await Logout();
                                isValidSession = false;
                            }
                        } else {
                            console.log('Refresh token also failed, logging out');
                            await Logout();
                            isValidSession = false;
                        }
                    }
                }
            } else {
                // Không có token nhưng có thể có refresh token
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (refreshToken) {
                    console.log('🔄 No JWT but found refresh token, attempting auto-login...');
                    const refreshResult = await authService.refreshToken();
                    if (refreshResult && refreshResult.token) {
                        console.log('✅ Auto-login via refresh token successful!');
                        // Fetch user profile
                        try {
                            const profileResponse = await authService.getProfile();
                            const userProfile = profileResponse?.user || profileResponse;
                            if (userProfile) {
                                setUser(userProfile);
                                await AsyncStorage.setItem('user_info', JSON.stringify(userProfile));
                                isValidSession = true;
                            }
                        } catch (profileErr) {
                            console.log('Auto-login profile fetch failed');
                            await Logout();
                        }
                    } else {
                        // Refresh token hết hạn, xóa sạch
                        await AsyncStorage.removeItem('refresh_token');
                    }
                }
            }

            // ⭐ Initialize Push Notifications on Auto-Login (Only if valid session)
            if (isValidSession) {
                try {
                    const notificationService = require('../api/notificationService').default;
                    await notificationService.initializePushNotifications();
                } catch (fcmError) {
                    console.log('FCM initialization failed (background):', fcmError);
                }
            }
        } catch (e) {
            console.log('Failed to load storage data', e);
        } finally {
            setLoading(false);
        }
    }

    const login = async (email: string, password: string) => {
        const data = await authService.login(email, password);
        console.log('Login response token:', data.token ? 'Present' : 'Missing');
        if (data.token) {
            await AsyncStorage.setItem('jwt_token', data.token);
        } else {
            console.error('CRITICAL: No token in login response', data);
        }

        // Lưu refresh token nếu có
        if (data.refreshToken) {
            await AsyncStorage.setItem('refresh_token', data.refreshToken);
            console.log('🔑 Refresh token saved to AsyncStorage');
        }

        // Use data from login response if available, or fetch profile
        let userProfile;

        try {
            const profileResponse = await authService.getProfile();
            userProfile = profileResponse.user || profileResponse;
        } catch (e: any) {
            console.log('Fetch profile failed during login, using login response user if available', e);
            if (e.response && e.response.status === 401) {
                console.log('Token expired or invalid, logging out...');
                await Logout();
                return;
            }
            if (data.user) {
                userProfile = data.user;
            } else {
                console.log('Using fallback user due to non-auth error');
                userProfile = {
                    user_id: 4,
                    full_name: email.split('@')[0],
                    email: email,
                    role: data.role || 'student'
                };
            }
        }


        if (userProfile) {
            setUser(userProfile);
            await AsyncStorage.setItem('user_info', JSON.stringify(userProfile));

            // ⭐ Register FCM token AFTER login
            try {
                const notificationService = require('../api/notificationService').default;
                await notificationService.initializePushNotifications();
            } catch (fcmError) {
                console.log('FCM initialization failed (non-critical):', fcmError);
            }
        }
    };

    const logout = async () => {
        // Gọi server logout để revoke refresh token
        try {
            await authService.serverLogout();
        } catch (e) {
            console.log('Server logout failed (non-critical):', e);
        }
        await Logout();
    };

    const Logout = async () => {
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('user_info');
        await AsyncStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
