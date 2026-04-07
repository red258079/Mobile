import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

const BASE_URL = 'http://192.168.43.25:3000/api';

const getClient = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
};

const statisticsService = {
    getStudentStatistics: async () => {
        const client = await getClient();
        console.log('Fetching statistics from:', `${BASE_URL}/student/statistics`);
        // Note: We need to ensure this endpoint maps to the /api/student/statistics route
        // If API_ENDPOINTS doesn't have it, we'll use the direct string or add it to config
        const response = await client.get('/student/statistics');
        return response.data;
    }
};

export default statisticsService;
