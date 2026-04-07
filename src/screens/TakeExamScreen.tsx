import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, BackHandler, AppState, Platform } from 'react-native';
import { Text, Title, RadioButton, Button, Surface, ProgressBar, Chip, ActivityIndicator, TextInput, Paragraph } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import examService from '../api/examService';
import practiceService from '../api/practiceService';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

// Define params type manually if types/navigation is not available or incomplete
type RootStackParamList = {
    TakeExam: { examId: number; isPractice?: boolean; title?: string; code?: string };
    ExamResult: { attempt: any };
};

type TakeExamScreenRouteProp = RouteProp<RootStackParamList, 'TakeExam'>;
type TakeExamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TakeExam'>;

export default function TakeExamScreen() {
    const route = useRoute<TakeExamScreenRouteProp>();
    const navigation = useNavigation<TakeExamScreenNavigationProp>();
    const { user } = useAuth();
    const appState = useRef(AppState.currentState);

    // Camera
    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const camera = useRef<Camera>(null);

    // Fallback to params or empty object if route.params is undefined
    const { examId, isPractice, title, code } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [examData, setExamData] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [attemptId, setAttemptId] = useState<number | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: any }>({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [violationCount, setViolationCount] = useState(0);

    useEffect(() => {
        if (!examId) {
            Alert.alert('Lỗi', 'Không tìm thấy ID bài thi');
            navigation.goBack();
            return;
        }

        // Request Camera Permission
        if (!hasPermission) {
            requestPermission();
        }

        startExamSession();

        // Disable back button
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert('Cảnh báo', 'Bạn đang làm bài thi. Không thể quay lại.', [{ text: 'OK' }]);
            return true;
        });

        // ⭐ APP STATE MONITORING (Detect leaving app)
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/active/) &&
                nextAppState.match(/inactive|background/)
            ) {
                console.log('App has come to the background!');
                handleViolation('Rời khỏi ứng dụng');
            }

            appState.current = nextAppState;
        });

        // ⭐ PERIODIC SNAPSHOTS -> REMOVED per user request to save DB space
        // Only capture on violation now.

        // ⭐ LISTEN FOR PENALTY ALERT
        const penaltyListener = (data: any) => {
            if (data.points_deducted) {
                Alert.alert(
                    '❌ BẠN ĐÃ BỊ TRỪ ĐIỂM',
                    `Hệ thống đã trừ ${data.points_deducted} điểm (20%) vì phát hiện bạn rời khỏi ứng dụng.\n\nNếu tiếp tục vi phạm, bài thi có thể bị hủy.`,
                    [{ text: 'Đã hiểu', style: 'cancel' }]
                );
            }
        };

        if (socketService.socket) {
            socketService.socket.on('points_deducted', penaltyListener);
        }

        // ⭐ RANDOMIZED IDENTITY CHECK (IMPERSONATION DETECTION)
        // Check randomly every 3-7 minutes (180s - 420s) to save DB but keep student on edge
        let randomCheckTimeout: NodeJS.Timeout;

        const scheduleNextCheck = () => {
            if (isPractice) return; // Ignore practice

            const minTime = 180 * 1000; // 3 minutes
            const maxTime = 420 * 1000; // 7 minutes
            const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1) + minTime);

            console.log(`📸 Next identity check in ${randomDelay / 1000} seconds`);

            randomCheckTimeout = setTimeout(() => {
                takeSnapshot('identity_check_random');
                scheduleNextCheck(); // Schedule next one
            }, randomDelay);
        };

        // Start the first check schedule
        scheduleNextCheck();

        // Also take ONE check immediately on start (Verification)
        setTimeout(() => takeSnapshot('identity_check_start'), 2000); // Wait 2s for camera to init

        return () => {
            backHandler.remove();
            subscription.remove();
            clearTimeout(randomCheckTimeout); // Clear random check
            if (socketService.socket) {
                socketService.socket.off('points_deducted', penaltyListener);
            }
        };
    }, [examId, hasPermission]); // Add hasPermission to re-trigger if needed

    const handleViolation = (reason: string) => {
        setViolationCount(prev => prev + 1);

        // Alert User
        Alert.alert(
            'CẢNH BÁO GIAN LẬN',
            `Hệ thống phát hiện bạn: ${reason}.\nVi phạm sẽ được ghi lại.`,
            [{ text: 'Đã hiểu' }]
        );

        // Send to Server
        if (socketService.socket && attemptId) {
            socketService.socket.emit('cheating_alert', {
                examId,
                attemptId,
                studentId: user?.user_id || user?.id,
                type: 'app_switch',
                description: reason
            });
        }

        // Take immediate snapshot
        takeSnapshot('violation_app_switch');
    };

    const takeSnapshot = async (reason: string) => {
        if (camera.current && isPractice !== true) { // Don't monitor practice exams strictly
            try {
                const photo = await camera.current.takePhoto({
                    qualityPrioritization: 'speed',
                    flash: 'off'
                });

                // Read file and convert to base64 to send via socket (simplest for now)
                const base64 = await RNFS.readFile(photo.path, 'base64');

                if (socketService.socket && attemptId) {
                    socketService.socket.emit('monitor_snapshot', {
                        examId,
                        attemptId,
                        studentId: user?.user_id || user?.id,
                        image: `data:image/jpeg;base64,${base64}`,
                        reason
                    });
                }
                console.log('📸 Snapshot taken:', reason);
            } catch (error) {
                console.log('Failed to take snapshot:', error);
            }
        }
    };

    // Timer Effect from previous code (restored)
    useEffect(() => {
        if (timeRemaining > 0 && !submitting) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeRemaining, submitting]);

    const startExamSession = async () => {
        try {
            setLoading(true);
            let data;
            if (isPractice) {
                data = await practiceService.startPracticeExam(examId);
            } else {
                // Pass code if available (needed for resuming or retrying start)
                data = await examService.startExam(examId, code);
            }

            setExamData(data.exam);
            setQuestions(data.questions || []);
            setAttemptId(data.attempt_id);

            // Set timer (minutes -> seconds)
            // Practice exam might default to 60 or from exam data
            const duration = data.exam.duration || 60;
            setTimeRemaining(duration * 60);

        } catch (error: any) {
            console.error('Start exam failed:', error);
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể bắt đầu bài thi', [
                { text: 'Quay lại', onPress: () => navigation.goBack() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = async (val: any) => {
        const currentQ = questions[currentQuestionIndex];
        const qId = currentQ.question_id || currentQ.id;

        // Optimistic update
        setAnswers(prev => ({
            ...prev,
            [qId]: val
        }));

        if (!attemptId) return;

        // Construct Payload
        const payload: any = {
            attempt_id: attemptId,
            question_id: qId,
        };

        if (currentQ.question_type === 'Essay') {
            payload.answer_text = val;
        } else {
            // For SingleChoice/MultiChoice, value is option_id
            payload.option_id = val;

            // Note: If MultipleChoice, logic needs to be arrays. 
            // Current UI only supports RadioButton (Single).
            // Assuming val is option_id (number)
        }

        try {
            // Call API silently
            await examService.saveAnswer(examId, payload);
        } catch (error) {
            console.log('Failed to save answer:', error);
            // Optional: Store failed saves to retry queue
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (submitting) return;

        const confirmSubmit = async () => {
            setSubmitting(true);
            try {
                let result;
                if (isPractice) {
                    result = await practiceService.submitPracticeExam(examId, attemptId!, answers);
                } else {
                    result = await examService.submitExam(examId, attemptId!, answers);
                }

                navigation.replace('ExamResult', {
                    attempt: {
                        ...result,
                        exam_id: examId, // CRITICAL: Add exam_id for result screen
                        attempt_id: result.attempt_id,
                        total_score: result.score,
                        max_score: result.total_points || 10
                    }
                });
            } catch (error: any) {
                Alert.alert('Lỗi nộp bài', error.response?.data?.error || 'Có lỗi xảy ra khi nộp bài.');
                setSubmitting(false);
            }
        };

        if (autoSubmit) {
            confirmSubmit();
        } else {
            Alert.alert(
                'Nộp bài',
                'Bạn có chắc chắn muốn nộp bài không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Nộp bài', onPress: confirmSubmit }
                ]
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={{ marginTop: 10 }}>Đang tải đề thi...</Text>
            </View>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Không tải được câu hỏi.</Text>
                <Button onPress={() => navigation.goBack()}>Quay lại</Button>
            </View>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / questions.length;

    // Support ID field variation (backend might return 'id' or 'question_id')
    const qId = currentQ.question_id || currentQ.id;
    const currentAnswer = answers[qId];

    return (
        <View style={styles.container}>
            {/* ⭐ HIDDEN CAMERA / PIP CAMERA (Bottom Right) */}
            {device && hasPermission && !isPractice && (
                <View style={styles.cameraContainer}>
                    <Camera
                        ref={camera}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={true}
                        photo={true}
                    />
                </View>
            )}

            <Surface style={styles.header} elevation={2}>
                {/* Show Violation Count if > 0 */}
                {violationCount > 0 && (
                    <Chip icon="alert-circle" style={{ backgroundColor: '#ffebee', marginBottom: 5 }} textStyle={{ color: 'red' }}>
                        Vi phạm: {violationCount}
                    </Chip>
                )}

                <View style={styles.headerRow}>
                    <Chip icon="clock-outline" textStyle={styles.timerText} style={{ backgroundColor: timeRemaining < 300 ? '#ffebee' : '#e3f2fd' }}>
                        {formatTime(timeRemaining)}
                    </Chip>
                    <Text style={styles.questionCounter}>
                        Câu {currentQuestionIndex + 1} / {questions.length}
                    </Text>
                </View>
                <ProgressBar progress={progress} color={timeRemaining < 300 ? "red" : "#6200ee"} style={styles.progress} />
            </Surface>

            <ScrollView style={styles.content}>
                <View style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                        <Chip style={styles.typeChip}>{currentQ.question_type === 'MultipleChoice' ? 'Chọn nhiều' : 'Trắc nghiệm'}</Chip>
                        <Text style={styles.pointsText}>{currentQ.points || 1} điểm</Text>
                    </View>
                    <Title style={styles.questionText}>{currentQ.question_content}</Title>
                </View>

                {currentQ.question_type === 'Essay' ? (
                    <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={6}
                        placeholder="Nhập câu trả lời của bạn..."
                        value={currentAnswer || ''}
                        onChangeText={handleAnswerSelect}
                        style={{ backgroundColor: 'white' }}
                    />
                ) : (
                    <RadioButton.Group
                        onValueChange={(val) => handleAnswerSelect(parseInt(val))} // Assuming val is option ID or index. Backend expects option_id generally.
                        value={currentAnswer?.toString() || ''}
                    >
                        {currentQ.options?.map((option: any, index: number) => {
                            // Backend options structure: { id/option_id, option_content }
                            const optId = option.id || option.option_id || index; // Use ID if available
                            return (
                                <Surface key={index} style={[
                                    styles.optionCard,
                                    currentAnswer === optId ? styles.selectedOption : {}
                                ]} elevation={1}>
                                    <RadioButton.Item
                                        label={option.option_content}
                                        value={optId.toString()}
                                        labelStyle={styles.optionLabel}
                                        color="#6200ee"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Surface>
                            );
                        })}
                    </RadioButton.Group>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="outlined"
                    onPress={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    style={styles.navButton}
                >
                    Câu trước
                </Button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                        mode="contained"
                        onPress={() => handleSubmit(false)}
                        style={styles.navButton}
                        loading={submitting}
                        disabled={submitting}
                        color="#d32f2f"
                    >
                        Nộp bài
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={handleNext}
                        style={styles.navButton}
                    >
                        Tiếp theo
                    </Button>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 15,
        backgroundColor: 'white',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionCounter: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progress: {
        height: 6,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    questionContainer: {
        marginBottom: 20,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    typeChip: {
        backgroundColor: '#e0e0e0',
    },
    pointsText: {
        color: '#666',
        fontWeight: 'bold',
    },
    questionText: {
        fontSize: 18,
        lineHeight: 26,
    },
    optionCard: {
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        borderColor: '#6200ee',
        backgroundColor: '#f3e5f5',
    },
    optionLabel: {
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'white',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    navButton: {
        flex: 0.48,
    },
    cameraContainer: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 100,
        height: 130,
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 9999, // Ensure it's on top
        borderWidth: 2,
        borderColor: 'red',
        backgroundColor: 'black'
    }
});
