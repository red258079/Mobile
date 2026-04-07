import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import TeacherTabNavigator from './TeacherTabNavigator';
import TeacherClassesScreen from '../screens/TeacherClassesScreen';
import TeacherExamsScreen from '../screens/TeacherExamsScreen';
import TeacherQuestionsScreen from '../screens/TeacherQuestionsScreen';
import TeacherGradingScreen from '../screens/TeacherGradingScreen';
import TeacherMaterialsScreen from '../screens/TeacherMaterialsScreen';
import TeacherStatisticsScreen from '../screens/TeacherStatisticsScreen';
import TeacherMonitoringScreen from '../screens/TeacherMonitoringScreen';
import ClassDetailScreen from '../screens/ClassDetailScreen';
import ExamDetailScreen from '../screens/ExamDetailScreen';
import TakeExamScreen from '../screens/TakeExamScreen';
import ExamResultScreen from '../screens/ExamResultScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import PracticeScreen from '../screens/PracticeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CreateExamScreen from '../screens/CreateExamScreen';
import TeacherExamDetailScreen from '../screens/TeacherExamDetailScreen';
import GenerateAIScreen from '../screens/GenerateAIScreen';
import EditExamScreen from '../screens/EditExamScreen';
import AddQuestionScreen from '../screens/AddQuestionScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, loading } = useAuth();
    const isTeacher = user?.role?.toLowerCase() === 'teacher';

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {user ? (
                    isTeacher ? (
                        <>
                            <Stack.Screen
                                name="TeacherMain"
                                component={TeacherTabNavigator}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="TeacherClasses"
                                component={TeacherClassesScreen}
                                options={{ title: 'Quản lý Lớp học' }}
                            />
                            <Stack.Screen
                                name="TeacherExams"
                                component={TeacherExamsScreen}
                                options={{ title: 'Quản lý Đề thi' }}
                            />
                            <Stack.Screen
                                name="CreateExam"
                                component={CreateExamScreen}
                                options={{ title: 'Tạo bài thi mới', headerShown: false }}
                            />
                            <Stack.Screen
                                name="TeacherExamDetail"
                                component={TeacherExamDetailScreen}
                                options={{ title: 'Chi tiết đề thi', headerShown: false }}
                            />
                            <Stack.Screen
                                name="GenerateAI"
                                component={GenerateAIScreen}
                                options={{ title: 'Tạo bằng AI', headerShown: false }}
                            />
                            <Stack.Screen
                                name="TeacherQuestions"
                                component={TeacherQuestionsScreen}
                                options={{ title: 'Ngân hàng câu hỏi' }}
                            />
                            <Stack.Screen
                                name="TeacherGrading"
                                component={TeacherGradingScreen}
                                options={{ title: 'Chấm điểm' }}
                            />
                            <Stack.Screen
                                name="TeacherMaterials"
                                component={TeacherMaterialsScreen}
                                options={{ title: 'Quản lý Tài liệu' }}
                            />
                            <Stack.Screen
                                name="TeacherStatistics"
                                component={TeacherStatisticsScreen}
                                options={{ title: 'Thống kê' }}
                            />
                            <Stack.Screen
                                name="TeacherMonitoring"
                                component={TeacherMonitoringScreen}
                                options={{ title: 'Giám sát thi' }}
                            />
                            <Stack.Screen
                                name="EditExam"
                                component={EditExamScreen}
                                options={{ title: 'Chỉnh sửa bài thi' }}
                            />
                            <Stack.Screen
                                name="AddQuestion"
                                component={AddQuestionScreen}
                                options={{ title: 'Thêm câu hỏi' }}
                            />
                            <Stack.Screen
                                name="ClassDetail"
                                component={ClassDetailScreen}
                                options={{ title: 'Chi tiết lớp học' }}
                            />
                            <Stack.Screen
                                name="ExamDetail"
                                component={ExamDetailScreen}
                                options={{ title: 'Chi tiết bài thi' }}
                            />
                            <Stack.Screen
                                name="Notifications"
                                component={NotificationsScreen}
                                options={{ title: 'Thông báo' }}
                            />
                        </>
                    ) : (
                        <>
                            <Stack.Screen
                                name="Main"
                                component={MainTabNavigator}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="ClassDetail"
                                component={ClassDetailScreen}
                                options={{ title: 'Class Details' }}
                            />
                            <Stack.Screen
                                name="ExamDetail"
                                component={ExamDetailScreen}
                                options={{ title: 'Exam Details' }}
                            />
                            <Stack.Screen
                                name="TakeExam"
                                component={TakeExamScreen}
                                options={{ title: 'Take Exam', headerLeft: () => null }}
                            />
                            <Stack.Screen
                                name="ExamResult"
                                component={ExamResultScreen}
                                options={{ title: 'Exam Results' }}
                            />
                            <Stack.Screen
                                name="Statistics"
                                component={StatisticsScreen}
                                options={{ title: 'Thống kê' }}
                            />
                            <Stack.Screen
                                name="Practice"
                                component={PracticeScreen}
                                options={{ title: 'Luyện tập' }}
                            />
                            <Stack.Screen
                                name="History"
                                component={HistoryScreen}
                                options={{ title: 'Lịch sử' }}
                            />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
