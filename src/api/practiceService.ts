import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const practiceService = {
    getPracticeExams: async () => {
        const client = await getClient();
        const response = await client.get('/student/practice/exams');
        return response.data;
    },

    getMaterials: async () => {
        const client = await getClient();
        const response = await client.get('/student/practice/materials');
        return response.data?.materials || [];
    },

    createPracticeExam: async (data: { material_id: number; prompt: string; ai_model: 'groq' | 'gemini' }) => {
        const client = await getClient();
        const response = await client.post('/student/practice/ai/create', data);
        return response.data;
    },

    startPracticeExam: async (examId: number) => {
        const client = await getClient();
        const response = await client.get(`/student/practice/exams/${examId}/start`);
        return response.data;
    },

    submitPracticeExam: async (examId: number, attemptId: number, answers: any) => {
        const client = await getClient();
        const response = await client.post(`/student/practice/exams/${examId}/submit`, {
            attempt_id: attemptId,
            answers: answers
        });
        return response.data;
    }
};

export default practiceService;
