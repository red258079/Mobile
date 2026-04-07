import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Chip, Divider, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import examService from '../api/examService';

type ExamResultScreenRouteProp = RouteProp<RootStackParamList, 'ExamResult'>;
type ExamResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExamResult'>;

export default function ExamResultScreen() {
    const route = useRoute<ExamResultScreenRouteProp>();
    const navigation = useNavigation<ExamResultScreenNavigationProp>();
    const theme = useTheme();
    const [attempt, setAttempt] = useState<any>(route.params?.attempt || {});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // If we only passed partial attempt data, we might need to fetch full details
    // However, usually the backend returns the full result on submit. 
    // If navigating from history, we might need to fetch.
    const loadResult = async () => {
        console.log('loadResult called. Current attempt state:', attempt);

        if (!attempt.exam_id || !attempt.attempt_id) {
            console.log('Missing exam_id or attempt_id in loadResult');
            return;
        }

        try {
            setLoading(true);
            const data = await examService.getExamResult(attempt.exam_id, attempt.attempt_id);
            console.log('API Result Data:', JSON.stringify(data, null, 2));

            // DEBUG: Show raw keys to user to verify data source
            // Remove this after fixing
            Alert.alert(
                "Debug Data",
                `Attempt Keys: ${Object.keys(data.attempt || {}).join(',')}\n` +
                `Results: ${data.results ? data.results.length : 'NULL'}\n` +
                `First Result: ${data.results && data.results.length > 0 ? JSON.stringify(data.results[0]).substring(0, 100) : 'N/A'}`
            );

            // Map keys from backend (student/exams.js) to component state
            setAttempt({
                ...data.attempt,
                total: data.attempt.total_points,
                details: data.results ? data.results.map((r: any) => ({
                    ...r,
                    student_answer: r.student_answer,
                    correct_answer: r.correct_answer_text, // Map correct_answer_text from API
                    question_content: r.question_content,
                    is_correct: r.is_correct === 1 // Ensure boolean
                })) : []
            });
        } catch (error) {
            console.error('Failed to load exam result', error);
            // Alert.alert('Lỗi', 'Không thể tải chi tiết kết quả bài thi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // ALWAYS fetch details to ensure we have the latest data and correct mapping
        // verify we have IDs first
        if (attempt.exam_id && attempt.attempt_id) {
            loadResult();
        } else {
            console.log('Cannot load result: Missing IDs', attempt);
        }
    }, [attempt.exam_id, attempt.attempt_id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadResult();
    };

    const percentage = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
    const passed = percentage >= 50; // Customize pass mark if needed

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10 }}>Đang tải kết quả...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Card style={[styles.scoreCard, passed ? styles.passedCard : styles.failedCard]}>
                <Card.Content>
                    <Title style={styles.scoreTitle}>
                        {passed ? '🎉 Đạt yêu cầu!' : '❌ Chưa đạt'}
                    </Title>
                    <Text style={styles.scoreText}>
                        {attempt.score} / {attempt.total || attempt.max_score || 10}
                    </Text>
                    <Chip
                        style={[styles.percentageChip, passed ? styles.passedChip : styles.failedChip]}
                        textStyle={styles.percentageText}
                    >
                        {percentage}%
                    </Chip>
                    {attempt.submitted_at && (
                        <Text style={styles.timestamp}>
                            Nộp lúc: {new Date(attempt.submitted_at).toLocaleString()}
                        </Text>
                    )}
                </Card.Content>
            </Card>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Title style={styles.sectionTitle}>Xem lại đáp án</Title>

                {attempt.details && attempt.details.length > 0 ? (
                    attempt.details.map((result: any, index: number) => (
                        <Card
                            key={index}
                            style={[
                                styles.questionCard,
                                result.is_correct ? styles.correctCard : styles.incorrectCard,
                            ]}
                        >
                            <Card.Content>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionNumber}>Câu {index + 1}</Text>
                                    <Chip
                                        icon={result.is_correct ? 'check-circle' : 'close-circle'}
                                        style={result.is_correct ? styles.correctBadge : styles.incorrectBadge}
                                        textStyle={{ color: 'white' }}
                                    >
                                        {result.is_correct ? 'Đúng' : 'Sai'}
                                    </Chip>
                                </View>
                                <Text style={styles.questionText}>{result.question_content || result.question_text}</Text>

                                <View style={styles.answerRow}>
                                    <Text style={styles.label}>Câu trả lời của bạn:</Text>
                                    <Text style={result.is_correct ? styles.correctText : styles.incorrectText}>
                                        {result.student_answer || result.user_answer || '(Không trả lời)'}
                                    </Text>
                                </View>

                                {!result.is_correct && (
                                    <View style={styles.answerRow}>
                                        <Text style={styles.label}>Đáp án đúng:</Text>
                                        <Text style={styles.correctText}>
                                            {result.correct_answer || result.correct_option_content}
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', margin: 20, color: '#666' }}>
                        Không có dữ liệu chi tiết câu hỏi (hoặc cần tải lại).
                    </Text>
                )}
            </View>

            <Button
                mode="contained"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                icon="arrow-left"
            >
                Về Bài Thi
            </Button>
        </ScrollView>
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
    scoreCard: {
        margin: 15,
        borderRadius: 12,
    },
    passedCard: {
        backgroundColor: '#e8f5e9',
    },
    failedCard: {
        backgroundColor: '#ffebee',
    },
    scoreTitle: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    scoreText: {
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    percentageChip: {
        alignSelf: 'center',
        marginTop: 10,
    },
    passedChip: {
        backgroundColor: '#4caf50',
    },
    failedChip: {
        backgroundColor: '#f44336',
    },
    percentageText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    timestamp: {
        textAlign: 'center',
        marginTop: 10,
        color: '#666',
    },
    divider: {
        marginVertical: 10,
    },
    section: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    questionCard: {
        marginBottom: 15,
        borderRadius: 10,
    },
    correctCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    incorrectCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    questionNumber: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    correctBadge: {
        backgroundColor: '#4caf50',
    },
    incorrectBadge: {
        backgroundColor: '#f44336',
    },
    questionText: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '500',
    },
    answerRow: {
        flexDirection: 'row',
        marginTop: 5,
        flexWrap: 'wrap',
    },
    label: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    correctText: {
        color: '#4caf50',
        fontWeight: '500',
    },
    incorrectText: {
        color: '#f44336',
        fontWeight: '500',
    },
    backButton: {
        margin: 15,
        marginBottom: 30,
        borderRadius: 8,
    },
});
