import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

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

const classService = {
    getMyClasses: async () => {
        const client = await getClient();
        const response = await client.get(API_ENDPOINTS.MY_CLASSES);
        return response.data.myClasses || [];
    },

    joinClass: async (classCode: string) => {
        const client = await getClient();
        const response = await client.post(API_ENDPOINTS.JOIN_CLASS, { classCode });
        return response.data;
    },

    getClassDetails: async (classId: number) => {
        const client = await getClient();
        const response = await client.get(`/student/classes/${classId}`); // Correct endpoint
        return response.data;
    },

    getClassMaterials: async (classId: number) => {
        const client = await getClient();
        const response = await client.get(`/student/classes/${classId}/materials`);
        return response.data;
    },
};

export default classService;
