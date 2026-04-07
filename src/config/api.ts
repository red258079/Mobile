// API Configuration - LOCAL TESTING with computer IP
// IMPORTANT: Use computer IP for physical device, localhost only works on emulator
export const API_BASE_URL = 'http://192.168.43.25:3000/api';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/user/profile',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',

    // Classes
    MY_CLASSES: '/student/classes/my',
    JOIN_CLASS: '/student/classes/join',
    CLASS_DETAIL: (classId: number) => `/classes/${classId}/detail`,

    // Exams
    GET_EXAMS: '/student/exams',
    START_EXAM: (examId: number) => `/student/exams/${examId}/start`,
    SUBMIT_EXAM: (examId: number) => `/student/exams/${examId}/submit`,
    EXAM_RESULT: (examId: number, attemptId: number) => `/student/exams/${examId}/result/${attemptId}`,
    EXAM_DETAIL: (examId: number) => `/student/exams/${examId}`, // For retaking attempts history
    SAVE_ANSWER: (examId: number) => `/student/exams/${examId}/save-answer`,

    // Notifications
    NOTIFICATIONS: '/notifications',
    MARK_READ: (notifId: number) => `/notifications/${notifId}/read`,
};
