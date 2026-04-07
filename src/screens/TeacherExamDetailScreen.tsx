import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, FAB, ActivityIndicator, Searchbar, IconButton, Menu, Divider, Appbar, SegmentedButtons, Portal, Modal, Chip, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import teacherService from '../api/teacherService';

import MonitoringTab from './components/MonitoringTab';

export default function TeacherExamDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { examId } = route.params || {};
    const theme = useTheme();

    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('questions'); // 'questions' | 'monitoring'

    useFocusEffect(
        useCallback(() => {
            if (examId) loadData();
        }, [examId])
    );

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getExamDetail(examId);
            setExam(data);

            // Note: getExamDetail in teacher/exams.js returns { ..., questions: [] }
            // So we might already have questions.
            if (data.questions) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Load exam detail error', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết bài thi');
        } finally {
            setLoading(false);
        }
    };

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.xls,
                    DocumentPicker.types.xlsx,
                    DocumentPicker.types.csv,
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ],
            });

            const file = result[0];
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            setLoading(true);
            const res = await teacherService.importQuestions(examId, formData);
            Alert.alert('Thành công', res.message);
            loadData();
        } catch (err) {
            if (DocumentPicker.isCancel(err)) return;
            console.error('Import error', err);
            Alert.alert('Lỗi', 'Import thất bại');
            setLoading(false);
        }
    };

    const handleGenerateAI = () => {
        navigation.navigate('GenerateAI', { examId });
    };

    const handleEditExam = () => {
        navigation.navigate('EditExam', { examId, examData: exam });
    };

    const handleDeleteQuestion = (questionId: number) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await teacherService.deleteQuestion(questionId);
                            loadData(); // Reload list
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa câu hỏi');
                        }
                    }
                }
            ]
        );
    };

    const handleAddQuestion = () => {
        navigation.navigate('AddQuestion', { examId });
    };

    if (!exam && loading) {
        return <View style={styles.loading}><Text>Đang tải...</Text></View>;
    }

    if (!exam) return <View><Text>Không tìm thấy bài thi</Text></View>;

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Chi tiết đề thi" />
                <Appbar.Action icon="pencil" onPress={handleEditExam} />
                <Appbar.Action icon="reload" onPress={loadData} />
            </Appbar.Header>

            <View style={{ padding: 10 }}>
                <SegmentedButtons
                    value={viewMode}
                    onValueChange={setViewMode}
                    buttons={[
                        {
                            value: 'questions',
                            label: 'Câu hỏi',
                            icon: 'format-list-bulleted',
                        },
                        {
                            value: 'monitoring',
                            label: 'Trạng thái nộp bài',
                            icon: 'eye',
                        },
                    ]}
                />
            </View>

            {viewMode === 'monitoring' ? (
                <MonitoringTab examId={examId} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title>{exam.exam_name}</Title>
                            <Paragraph>{exam.description}</Paragraph>
                            <View style={styles.row}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.label}>Thời gian:</Text>
                                    <Text style={styles.value}>{exam.duration} phút</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.label}>Bắt đầu:</Text>
                                    <Text style={styles.value}>{new Date(exam.start_time).toLocaleString('vi-VN')}</Text>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.label}>Trạng thái:</Text>
                                    <Text style={[styles.value, {
                                        color: exam.current_status === 'active' ? 'green' :
                                            exam.current_status === 'upcoming' ? 'blue' : 'gray'
                                    }]}>
                                        {exam.current_status}
                                    </Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.label}>Số câu hỏi:</Text>
                                    <Text style={styles.value}>{questions.length}</Text>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                <Button
                                    mode="contained"
                                    icon="file-excel"
                                    onPress={handleImportExcel}
                                    style={[styles.actionBtn, { backgroundColor: '#6200ee' }]}
                                >
                                    Import Excel
                                </Button>
                                <Button
                                    mode="contained"
                                    icon="robot"
                                    onPress={handleGenerateAI}
                                    style={[styles.actionBtn, { backgroundColor: '#6200ee' }]}
                                >
                                    Tạo bằng AI
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>

                    <Title style={styles.sectionTitle}>Danh sách câu hỏi ({questions.length})</Title>

                    {questions.length === 0 ? (
                        <Text style={styles.emptyText}>Chưa có câu hỏi nào. Hãy Import hoặc tạo bằng AI.</Text>
                    ) : (
                        questions.map((q, index) => (
                            <Card key={index} style={styles.questionCard}>
                                <Card.Content>
                                    <View style={styles.questionHeader}>
                                        <Text style={styles.questionIndex}>Câu {index + 1} ({q.points || 1} điểm)</Text>
                                        <View style={{ flexDirection: 'row' }}>
                                            <IconButton
                                                icon="pencil"
                                                iconColor="blue"
                                                size={20}
                                                onPress={() => navigation.navigate('AddQuestion', { examId, questionData: q, isEditing: true })}
                                            />
                                            <IconButton
                                                icon="delete"
                                                iconColor="red"
                                                size={20}
                                                onPress={() => handleDeleteQuestion(q.question_id)}
                                            />
                                        </View>
                                    </View>
                                    <Paragraph style={styles.questionContent}>{q.question_content}</Paragraph>

                                    <Divider style={{ marginVertical: 8 }} />

                                    {q.options && q.options.map((opt: any, optIdx: number) => (
                                        <View key={optIdx} style={styles.optionRow}>
                                            <Text style={[
                                                styles.optionText,
                                                opt.is_correct ? styles.correctOption : null
                                            ]}>
                                                {String.fromCharCode(65 + optIdx)}. {opt.option_content}
                                            </Text>
                                            {opt.is_correct === 1 && <Text style={{ color: 'green', marginLeft: 5 }}>✓</Text>}
                                        </View>
                                    ))}

                                    <View style={styles.metaRow}>
                                        <Chip icon="shape" style={styles.chip}>{q.question_type}</Chip>
                                        <Chip icon="speedometer" style={styles.chip}>{q.difficulty}</Chip>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                    <View style={{ height: 50 }} />
                </ScrollView>
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleAddQuestion}
                label="Thêm câu hỏi"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 20,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    infoItem: {
        width: '48%',
    },
    label: {
        fontSize: 12,
        color: '#666',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionBtn: {
        width: '48%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    questionCard: {
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    questionIndex: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    questionPoints: {
        fontSize: 12,
        color: '#666',
    },
    questionContent: {
        fontSize: 16,
        marginBottom: 5,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    correctOption: {
        fontWeight: 'bold',
        color: 'green',
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    chip: {
        marginRight: 8,
        height: 30,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#E6E6FA' // Lavender
    },
});
