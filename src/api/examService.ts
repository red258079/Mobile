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

const examService = {
    getExams: async () => {
        const client = await getClient();
        const response = await client.get(API_ENDPOINTS.GET_EXAMS);
        return response.data;
    },

    startExam: async (examId: number, examCode?: string) => {
        const client = await getClient();
        const payload = examCode ? { exam_code: examCode } : {};
        const response = await client.post(API_ENDPOINTS.START_EXAM(examId), payload);
        return response.data;
    },

    saveAnswer: async (examId: number, payload: any) => {
        const client = await getClient();
        // payload: { attempt_id, question_id, answer_text, option_id }
        const response = await client.post(API_ENDPOINTS.SAVE_ANSWER(examId), payload);
        return response.data;
    },

    submitExam: async (examId: number, attemptId: number, answers?: any) => {
        const client = await getClient();
        const response = await client.post(API_ENDPOINTS.SUBMIT_EXAM(examId), { attempt_id: attemptId }); // Answers are usually saved progressively, but keeping signature flexible if needed
        return response.data;
    },

    getExamResult: async (examId: number, attemptId: number) => {
        const client = await getClient();
        const response = await client.get(API_ENDPOINTS.EXAM_RESULT(examId, attemptId));
        return response.data;
    },

    getExamDetails: async (examId: number) => {
        const client = await getClient();
        const response = await client.get(API_ENDPOINTS.EXAM_DETAIL(examId));
        return response.data;
    }
};

export default examService;
