import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, Title, RadioButton, Checkbox, HelperText, useTheme, SegmentedButtons, Text } from 'react-native-paper';
import teacherService from '../api/teacherService';
import { useNavigation, useRoute } from '@react-navigation/native';

const AddQuestionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { examId, questionData, isEditing } = route.params as { examId: number, questionData?: any, isEditing?: boolean } || {};
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [questionContent, setQuestionContent] = useState(questionData?.question_content || '');
    const [questionType, setQuestionType] = useState(questionData?.question_type || 'SingleChoice');
    const [difficulty, setDifficulty] = useState(questionData?.difficulty || 'Medium');
    const [points, setPoints] = useState(questionData?.points?.toString() || '1');
    const [options, setOptions] = useState(
        questionData?.options?.map((o: { option_text: string; content: string; is_correct: any; }) => ({ content: o.option_text || o.content, is_correct: !!o.is_correct })) ||
        [
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
        ]
    );
    const [correctAnswerText, setCorrectAnswerText] = useState(questionData?.correct_answer_text || '');

    React.useEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'
        });
    }, [navigation, isEditing]);

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].content = text;
        setOptions(newOptions);
    };

    const handleCorrectChange = (index: number) => {
        const newOptions = [...options];
        if (questionType === 'SingleChoice') {
            newOptions.forEach(opt => opt.is_correct = false);
            newOptions[index].is_correct = true;
        } else {
            newOptions[index].is_correct = !newOptions[index].is_correct;
        }
        setOptions(newOptions);
    };

    const handleSave = async () => {
        // Basic validation
        if (!questionContent.trim()) {
            Alert.alert('Lỗi', 'Nội dung câu hỏi không được để trống');
            return;
        }

        if (questionType !== 'Essay' && questionType !== 'FillInBlank') {
            const validOptions = options.filter(o => o.content.trim() !== '');
            if (validOptions.length < 2) {
                Alert.alert('Lỗi', 'Vui lòng nhập ít nhất 2 đáp án');
                return;
            }
            if (!correctAnswerText) {
                Alert.alert('Lỗi', 'Vui lòng chọn đáp án đúng');
                return;
            }
        }

        try {
            const payload = {
                question_content: questionContent,
                question_type: questionType,
                difficulty,
                options: options.filter(o => o.content.trim() !== ''),
                correct_answer_text: correctAnswerText,
            };

            // CHECK MODE: If local, return data instead of calling API
            // @ts-ignore
            if (route.params?.mode === 'local') {
                navigation.navigate({
                    name: 'CreateExam',
                    params: { newQuestion: payload, merge: true },
                } as any);
                return;
            }

            setLoading(true);

            if (isEditing && questionData?.question_id) {
                // UPDATE
                await teacherService.updateQuestion(examId, questionData.question_id, payload);
                Alert.alert('Thành công', 'Đã cập nhật câu hỏi', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // CREATE DIRECTLY
                const createRes = await teacherService.createQuestion(payload);
                const questionId = createRes.question_id;

                if (examId && questionId) {
                    await teacherService.linkQuestionToExam(examId, questionId, parseFloat(points));
                }

                Alert.alert('Thành công', 'Đã thêm câu hỏi vào bài thi', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Lỗi', error.response?.data?.error || (isEditing ? 'Cập nhật thất bại' : 'Thêm câu hỏi thất bại'));
        } finally {
            if (route.params?.mode !== 'local') {
                setLoading(false);
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Nội dung câu hỏi</Title>
                    <TextInput
                        mode="outlined"
                        value={questionContent}
                        onChangeText={setQuestionContent}
                        multiline
                        numberOfLines={3}
                        placeholder="Nhập nội dung câu hỏi..."
                        style={styles.input}
                    />

                    <Title style={styles.sectionTitle}>Loại câu hỏi</Title>
                    <SegmentedButtons
                        value={questionType}
                        onValueChange={setQuestionType}
                        buttons={[
                            { value: 'SingleChoice', label: '1 Đáp án' },
                            { value: 'MultipleChoice', label: 'Nhiều ĐA' },
                            { value: 'Essay', label: 'Tự luận' },
                        ]}
                        style={styles.segmented}
                    />

                    <Title style={styles.sectionTitle}>Độ khó & Điểm</Title>
                    <View style={styles.row}>
                        <SegmentedButtons
                            value={difficulty}
                            onValueChange={setDifficulty}
                            buttons={[
                                { value: 'Easy', label: 'Dễ' },
                                { value: 'Medium', label: 'TB' },
                                { value: 'Hard', label: 'Khó' },
                            ]}
                            style={{ flex: 2, marginRight: 10 }}
                        />
                        <TextInput
                            label="Điểm"
                            value={points}
                            onChangeText={setPoints}
                            keyboardType="numeric"
                            mode="outlined"
                            style={{ flex: 1 }}
                        />
                    </View>

                    {(questionType === 'SingleChoice' || questionType === 'MultipleChoice') && (
                        <>
                            <Title style={styles.sectionTitle}>Các lựa chọn</Title>
                            <HelperText type="info">Nhập nội dung và chọn đáp án đúng</HelperText>
                            {options.map((opt: { content: string; is_correct: boolean }, index: number) => (
                                <View key={index} style={styles.optionContainer}>
                                    <View style={styles.optionHeader}>
                                        <Text style={styles.optionLabel}>Đáp án {String.fromCharCode(65 + index)}</Text>
                                        <TouchableOpacity onPress={() => handleCorrectChange(index)}>
                                            <Text style={[styles.correctLabel, opt.is_correct ? styles.correctActive : null]}>
                                                {opt.is_correct ? 'ĐÚNG' : 'SAI'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={opt.content}
                                        onChangeText={(text) => handleOptionChange(index, text)}
                                        placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + index)}`}
                                        mode="outlined"
                                    />
                                </View>
                            ))}
                        </>
                    )}

                    {questionType === 'Essay' && (
                        <TextInput
                            label="Đáp án mẫu / Gợi ý chấm điểm"
                            value={correctAnswerText}
                            onChangeText={setCorrectAnswerText}
                            multiline
                            numberOfLines={3}
                            mode="outlined"
                            style={styles.input}
                        />
                    )}

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveButton}
                        icon="content-save"
                    >
                        Lưu câu hỏi
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
    card: { marginBottom: 20 },
    input: { marginBottom: 15, backgroundColor: 'white' },
    sectionTitle: { marginTop: 15, marginBottom: 5, fontSize: 16, fontWeight: 'bold' },
    segmented: { marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    optionContainer: { marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    optionLabel: { fontWeight: 'bold', color: '#555' },
    correctLabel: { fontSize: 12, fontWeight: 'bold', color: '#ccc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#ccc' },
    correctActive: { color: 'green', borderColor: 'green', backgroundColor: '#e8f5e9' },
    saveButton: { marginTop: 20, paddingVertical: 5 }
});

export default AddQuestionScreen;
