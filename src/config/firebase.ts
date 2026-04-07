import messaging from '@react-native-firebase/messaging';

import { PermissionsAndroid, Platform } from 'react-native';

export const requestUserPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            console.log('Permission POST_NOTIFICATIONS:', granted);
        } catch (err) {
            console.warn(err);
        }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
    return enabled;
};

export const getFCMToken = async () => {
    try {
        const token = await messaging().getToken();
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};
