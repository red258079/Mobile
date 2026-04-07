import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

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

const teacherService = {
    // === CLASSES ===
    getClasses: async () => {
        const client = await getClient();
        const response = await client.get('/teacher/classes');
        return response.data;
    },

    getClassDetails: async (classId: number) => {
        const client = await getClient();
        const response = await client.get(`/teacher/classes/${classId}`);
        return response.data;
    },

    getClassMaterials: async (classId: number) => {
        const client = await getClient();
        const response = await client.get(`/teacher/classes/${classId}/materials`);
        return response.data;
    },

    uploadMaterial: async (classId: number, formData: FormData) => {
        const client = await getClient();
        const response = await client.post(`/teacher/classes/${classId}/materials`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // === EXAMS ===
    getAllExams: async () => {
        const client = await getClient();
        // Route from server/routes/teacher/classes.js line 727
        const response = await client.get('/teacher/classes/exams/all');
        return response.data;
    },

    createExam: async (classId: number, examData: any) => {
        const client = await getClient();
        const response = await client.post(`/teacher/classes/${classId}/exams`, examData);
        return response.data;
    },

    getExamDetail: async (examId: number) => {
        const client = await getClient();
        // Route from server/routes/teacher/exams.js
        const response = await client.get(`/teacher/exams/${examId}/detail`);
        return response.data;
    },

    deleteExam: async (examId: number) => {
        const client = await getClient();
        const response = await client.delete(`/teacher/exams/${examId}`);
        return response.data;
    },

    importQuestions: async (examId: number, formData: FormData) => {
        const client = await getClient();
        const response = await client.post(`/teacher/exams/${examId}/import-questions`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    generateExamAI: async (params: any) => {
        const client = await getClient();
        // Route from server/routes/shared/ai.js, mounted at /api/ai in app.js
        const response = await client.post('/ai/generate-exam', params);
        return response.data;
    },

    saveQuestionsToExam: async (examId: number, questions: any[]) => {
        const client = await getClient();
        const response = await client.post(`/teacher/exams/${examId}/save-questions`, { questions });
        return response.data;
    },

    getQuestionBank: async (params?: any) => {
        const client = await getClient();
        const response = await client.get('/teacher/exams/question-bank', { params });
        return response.data;
    },

    // === GRADING ===
    getPendingGrading: async () => {
        const client = await getClient();
        const response = await client.get('/teacher/grading/pending');
        return response.data;
    },

    getGradedExams: async () => {
        const client = await getClient();
        const response = await client.get('/teacher/grading/graded');
        return response.data;
    },
    // === MONITORING ===
    getExamMonitoring: async (examId: number) => {
        const client = await getClient();
        const response = await client.get(`/teacher/monitoring/${examId}/students-status`);
        return response.data;
    },

    updateExam: async (examId: number, data: any) => {
        const client = await getClient();
        const response = await client.put(`/teacher/exams/${examId}`, data);
        return response.data;
    },

    updateQuestion: async (examId: number, questionId: number, data: any) => {
        const client = await getClient();
        const response = await client.put(`/teacher/exams/${examId}/questions/${questionId}`, data);
        return response.data;
    },

    createQuestion: async (data: any) => {
        const client = await getClient();
        const response = await client.post(`/teacher/exams/question-bank`, data);
        return response.data;
    },

    deleteQuestion: async (questionId: number) => {
        const client = await getClient();
        const response = await client.delete(`/teacher/exams/question-bank/${questionId}`);
        return response.data;
    },

    linkQuestionToExam: async (examId: number, questionId: number, points: number = 1) => {
        const client = await getClient();
        const response = await client.post(`/teacher/exams/${examId}/questions/${questionId}`, { points });
        return response.data;
    }
};

export default teacherService;
