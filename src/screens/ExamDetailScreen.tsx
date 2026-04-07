import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Button, Divider, Chip, Surface, Dialog, TextInput, Portal } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import examService from '../api/examService';

type ExamDetailScreenRouteProp = RouteProp<RootStackParamList, 'ExamDetail'>;
type ExamDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExamDetail'>;

export default function ExamDetailScreen() {
    const route = useRoute<ExamDetailScreenRouteProp>();
    const navigation = useNavigation<ExamDetailScreenNavigationProp>();
    const exam = route.params?.exam || {};
    const [attempts, setAttempts] = useState<any[]>([]);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchExamDetails = async () => {
            if (!exam.exam_id) return;
            try {
                const data = await examService.getExamDetails(exam.exam_id);
                if (data.attempts) {
                    setAttempts(data.attempts.map((a: any) => ({
                        ...a,
                        score: a.score || 0,
                        // Use total_points from API if available, else default
                        total: data.exam?.total_points || 10,
                        submitted_at: a.end_time ? new Date(a.end_time).toLocaleString('vi-VN') : 'Đang làm bài'
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch exam details', error);
            }
        };

        fetchExamDetails();
    }, [exam.exam_id]);

    const handleStartExam = async (code?: string) => {
        try {
            setLoading(true);
            // Try to start exam. If code provided, use it.
            await examService.startExam(exam.exam_id, code);
            // If successful, navigate to TakeExam
            setLoading(false);
            // Pass examId and code explicitly to TakeExamScreen
            navigation.navigate('TakeExam', {
                examId: exam.exam_id,
                exam,
                title: exam.exam_name,
                code: code // Pass the code so TakeExamScreen can resend it
            });
        } catch (error: any) {
            setLoading(false);
            console.log('Start Exam Error:', error.response?.data);

            // Check if requires code
            if (error.response?.data?.requires_code || error.response?.status === 403) {
                // Show password dialog if not already showing or if code was wrong
                if (!passwordVisible || code) {
                    if (code) Alert.alert('Lỗi', 'Mã code không đúng!');
                    setPasswordVisible(true);
                }
            } else {
                Alert.alert('Lỗi', error.response?.data?.error || 'Không thể bắt đầu bài thi');
            }
        }
    };

    const submitPassword = () => {
        handleStartExam(password);
    };

    const handleViewResult = (attempt: any) => {
        // Ensure exam_id is included in the attempt object
        navigation.navigate('ExamResult', {
            attempt: {
                ...attempt,
                exam_id: exam.exam_id // Critical: Add exam_id from current exam context
            }
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.header} elevation={2}>
                <Title style={styles.title}>{exam.exam_name || 'Bài thi'}</Title>
                <View style={styles.infoRow}>
                    <Chip icon="clock-outline" style={styles.chip}>
                        {exam.duration || 60} phút
                    </Chip>
                    <Chip icon="help-circle-outline" style={styles.chip}>
                        {exam.total_questions || 30} câu hỏi
                    </Chip>
                </View>
            </Surface>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Hướng dẫn</Title>
                        <Text style={styles.text}>
                            • Trả lời tất cả câu hỏi{'\n'}
                            • Bạn không thể quay lại sau khi nộp bài{'\n'}
                            • Thời gian sẽ bắt đầu tính khi bạn nhấn Bắt đầu{'\n'}
                            • Tự động nộp bài khi hết giờ
                        </Text>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={() => handleStartExam()}
                    style={styles.startButton}
                    contentStyle={styles.buttonContent}
                    icon="play-circle"
                >
                    Bắt đầu làm bài
                </Button>

                <Divider style={styles.divider} />

                <Title style={styles.sectionTitle}>Lịch sử là bài</Title>
                {attempts.length > 0 ? (
                    attempts.map((attempt) => (
                        <Card key={attempt.attempt_id} style={styles.attemptCard}>
                            <Card.Title
                                title={`Điểm: ${attempt.score}/${attempt.total}`}
                                subtitle={`Nộp lúc: ${attempt.submitted_at}`}
                                left={(props) => <Chip {...props}>{Math.round((attempt.score / attempt.total) * 100)}%</Chip>}
                                right={(props) => (
                                    <Button {...props} mode="text" onPress={() => handleViewResult(attempt)}>
                                        Xem chi tiết
                                    </Button>
                                )}
                            />
                        </Card>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Chưa có lần làm bài nào</Text>
                )}
            </View>

            <Portal>
                <Dialog visible={passwordVisible} onDismiss={() => setPasswordVisible(false)}>
                    <Dialog.Title>Nhập mã code bài thi</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Mã code (Mật khẩu)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={false} // Exam codes might be plain text
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setPasswordVisible(false)}>Hủy</Button>
                        <Button onPress={submitPassword} loading={loading}>Vào thi</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6200ee',
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    chip: {
        marginRight: 10,
    },
    content: {
        padding: 15,
    },
    card: {
        marginBottom: 15,
        borderRadius: 10,
    },
    text: {
        lineHeight: 24,
        marginTop: 10,
    },
    startButton: {
        marginVertical: 10,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    attemptCard: {
        marginBottom: 10,
        borderRadius: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
});
