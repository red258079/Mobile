export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
    ClassDetail: { classData: any };
    ExamDetail: { exam: any };
    TakeExam: { exam: any; examId?: number; title?: string; code?: string };
    ExamResult: { attempt: any };
};
