import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Appbar, Card, Divider, Chip, Portal, Dialog, Menu, Checkbox, Switch } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import teacherService from '../api/teacherService';

export default function GenerateAIScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { examId: initialExamId } = route.params || {};

    // AI Params
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState('10');
    const [difficulty, setDifficulty] = useState('medium');
    const [additionalReq, setAdditionalReq] = useState('');
    const [aiModel, setAiModel] = useState('groq');

    // Question Types
    const [questionTypes, setQuestionTypes] = useState<string[]>(['SingleChoice']);

    // Exam Info (Only for New Exam)
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [examName, setExamName] = useState('');

    // Date Time strings
    const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
    const [timeStr, setTimeStr] = useState('08:00');

    const [duration, setDuration] = useState('60');
    const [maxPoints, setMaxPoints] = useState('10');
    const [shuffleQuestions, setShuffleQuestions] = useState(true);
    const [shuffleOptions, setShuffleOptions] = useState(true);

    // Unsaved State
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [showClassMenu, setShowClassMenu] = useState(false);

    useEffect(() => {
        if (!initialExamId) {
            fetchClasses();
        }
    }, [initialExamId]);

    const fetchClasses = async () => {
        try {
            const data = await teacherService.getClasses();
            setClasses(data);
        } catch (err) {
            console.error('Fetch classes error', err);
        }
    };

    const toggleQuestionType = (type: string) => {
        if (questionTypes.includes(type)) {
            setQuestionTypes(questionTypes.filter(t => t !== type));
        } else {
            setQuestionTypes([...questionTypes, type]);
        }
    };

    const handleGenerate = async () => {
        if (!subject || !topic) {
            Alert.alert('Lỗi', 'Vui lòng nhập Môn học và Nội dung');
            return;
        }
        if (questionTypes.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 loại câu hỏi');
            return;
        }
        if (!initialExamId && !selectedClass) {
            Alert.alert('Lỗi', 'Vui lòng chọn lớp học');
            return;
        }

        try {
            setLoading(true);
            const params = {
                subject,
                topic,
                numQuestions: parseInt(numQuestions),
                difficulty,
                questionTypes,
                additionalRequirements: additionalReq,
                ai_model: aiModel
            };

            const result = await teacherService.generateExamAI(params);
            if (result.success && result.questions) {
                setGeneratedQuestions(result.questions);
                // Auto generate exam name if empty
                if (!examName && !initialExamId) {
                    setExamName(`Kiểm tra ${subject} - ${topic}`);
                }
            } else {
                Alert.alert('Thông báo', 'Không tạo được câu hỏi nào');
            }
        } catch (error: any) {
            console.error('Generate AI error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo câu hỏi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (generatedQuestions.length === 0) return;

        try {
            setLoading(true);
            let targetExamId = initialExamId;

            if (!targetExamId) {
                // Create New Exam First
                if (!examName || !selectedClass) {
                    Alert.alert('Lỗi', 'Thiếu thông tin bài thi');
                    setLoading(false);
                    return;
                }

                const examData = {
                    examName,
                    description: `AI Generated (${aiModel}). Topic: ${topic}`,
                    examDate: dateStr,
                    examTime: timeStr,
                    duration: parseInt(duration),
                    shuffleQuestions,
                    shuffleOptions
                };

                const newExam = await teacherService.createExam(selectedClass.class_id, examData);
                if (!newExam?.exam?.exam_id) throw new Error('Failed to create exam');
                targetExamId = newExam.exam.exam_id;
            }

            // Save Questions
            const res = await teacherService.saveQuestionsToExam(targetExamId, generatedQuestions);

            Alert.alert(
                'Thành công',
                `Đã lưu ${res.saved} câu hỏi vào bài thi "${examName || 'Hiện tại'}"`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );

        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Lỗi', 'Lưu thất bại: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={initialExamId ? "Thêm câu hỏi AI" : "Tạo đề thi AI"} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                {/* AI Configuration Section */}
                <Card style={styles.card}>
                    <Card.Title title="🤖 Cấu hình tạo câu hỏi" />
                    <Card.Content>
                        <View style={styles.row}>
                            <Text style={styles.label}>Model AI:</Text>
                            <SegmentedButtons
                                value={aiModel}
                                onValueChange={setAiModel}
                                density="small"
                                buttons={[
                                    { value: 'groq', label: 'Groq (Nhanh)' },
                                    { value: 'gemini', label: 'Gemini (Smart)' },
                                ]}
                                style={{ flex: 1 }}
                            />
                        </View>

                        <TextInput label="Môn học / Chủ đề *" value={subject} onChangeText={setSubject} mode="outlined" style={styles.input} placeholder="VD: Toán học" />
                        <TextInput label="Nội dung cụ thể *" value={topic} onChangeText={setTopic} mode="outlined" style={styles.input} placeholder="VD: Phương trình bậc 2" />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <TextInput label="Số câu (5-50)" value={numQuestions} onChangeText={setNumQuestions} keyboardType="numeric" mode="outlined" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Độ khó</Text>
                                <SegmentedButtons
                                    value={difficulty}
                                    onValueChange={setDifficulty}
                                    density="small"
                                    buttons={[
                                        { value: 'easy', label: 'Dễ' },
                                        { value: 'medium', label: 'Vừa' },
                                        { value: 'mixed', label: 'Hỗn' },
                                    ]}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { marginTop: 12 }]}>Loại câu hỏi *</Text>
                        <View style={styles.checkboxGroup}>
                            <Checkbox.Item label="Trắc nghiệm 1 đáp án" status={questionTypes.includes('SingleChoice') ? 'checked' : 'unchecked'} onPress={() => toggleQuestionType('SingleChoice')} position="leading" labelStyle={{ textAlign: 'left' }} />
                            <Checkbox.Item label="Trắc nghiệm nhiều đáp án" status={questionTypes.includes('MultipleChoice') ? 'checked' : 'unchecked'} onPress={() => toggleQuestionType('MultipleChoice')} position="leading" labelStyle={{ textAlign: 'left' }} />
                            <Checkbox.Item label="Điền từ" status={questionTypes.includes('FillInBlank') ? 'checked' : 'unchecked'} onPress={() => toggleQuestionType('FillInBlank')} position="leading" labelStyle={{ textAlign: 'left' }} />
                            <Checkbox.Item label="Tự luận" status={questionTypes.includes('Essay') ? 'checked' : 'unchecked'} onPress={() => toggleQuestionType('Essay')} position="leading" labelStyle={{ textAlign: 'left' }} />
                        </View>

                        <TextInput label="Yêu cầu thêm (Tùy chọn)" value={additionalReq} onChangeText={setAdditionalReq} mode="outlined" multiline style={styles.input} />

                    </Card.Content>
                </Card>

                {/* Exam Info Section (Only if Creating New Exam) */}
                {!initialExamId && (
                    <Card style={[styles.card, { marginTop: 16 }]}>
                        <Card.Title title="📝 Thông tin bài thi" />
                        <Card.Content>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={styles.label}>Chọn lớp học *</Text>
                                <Menu
                                    visible={showClassMenu}
                                    onDismiss={() => setShowClassMenu(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => setShowClassMenu(true)}>
                                            <TextInput
                                                mode="outlined"
                                                value={selectedClass ? selectedClass.class_name : 'Chọn lớp...'}
                                                editable={false}
                                                right={<TextInput.Icon icon="chevron-down" />}
                                            />
                                        </TouchableOpacity>
                                    }
                                >
                                    <ScrollView style={{ maxHeight: 200 }}>
                                        {classes.map((c) => (
                                            <Menu.Item key={c.class_id} onPress={() => { setSelectedClass(c); setShowClassMenu(false); }} title={c.class_name} />
                                        ))}
                                    </ScrollView>
                                </Menu>
                            </View>

                            <TextInput label="Tên bài thi (Tự động nếu để trống)" value={examName} onChangeText={setExamName} mode="outlined" style={styles.input} />

                            <View style={styles.row}>
                                <TextInput
                                    label="Ngày thi (YYYY-MM-DD)"
                                    value={dateStr}
                                    onChangeText={setDateStr}
                                    mode="outlined"
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <TextInput
                                    label="Giờ thi (HH:MM)"
                                    value={timeStr}
                                    onChangeText={setTimeStr}
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                />
                            </View>

                            <View style={[styles.row, { marginTop: 12 }]}>
                                <TextInput label="Thời gian (phút)" value={duration} onChangeText={setDuration} keyboardType="numeric" mode="outlined" style={{ flex: 1, marginRight: 8 }} />
                                <TextInput label="Điểm tối đa" value={maxPoints} onChangeText={setMaxPoints} keyboardType="numeric" mode="outlined" style={{ flex: 1 }} />
                            </View>

                            <View style={styles.row}>
                                <View style={styles.switchContainer}>
                                    <Text>Xáo trộn câu hỏi</Text>
                                    <Switch value={shuffleQuestions} onValueChange={setShuffleQuestions} />
                                </View>
                                <View style={styles.switchContainer}>
                                    <Text>Xáo trộn đáp án</Text>
                                    <Switch value={shuffleOptions} onValueChange={setShuffleOptions} />
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Actions */}
                <View style={{ marginTop: 20 }}>
                    <Button mode="contained" onPress={handleGenerate} loading={loading} disabled={loading} icon="creation">
                        Tạo & Xem trước
                    </Button>
                </View>

                {generatedQuestions.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                        <Divider />
                        <Text variant="titleLarge" style={{ marginVertical: 12 }}>Kết quả ({generatedQuestions.length} câu hỏi)</Text>
                        {generatedQuestions.map((q, index) => (
                            <Card key={index} style={styles.questionCard}>
                                <Card.Content>
                                    <View style={styles.row}>
                                        <Chip style={styles.chip}>{q.type || q.question_type}</Chip>
                                        <Chip style={styles.chip}>{q.difficulty || difficulty}</Chip>
                                    </View>
                                    <Text style={styles.qText}>Câu {index + 1}: {q.question_content || q.questionText}</Text>
                                    {(q.options || []).map((o: any, i: number) => (
                                        <Text key={i}>{typeof o === 'string' ? o : o.content}</Text>
                                    ))}
                                    <Text style={{ color: 'blue', marginTop: 4 }}>Đáp án: {q.correct_answer || q.correctAnswer}</Text>
                                </Card.Content>
                            </Card>
                        ))}

                        <Button
                            mode="contained"
                            onPress={handleSave}
                            style={{ marginTop: 16, backgroundColor: 'green' }}
                            icon="content-save"
                            loading={loading}
                        >
                            {initialExamId ? 'Lưu vào bài thi này' : 'Lưu bài thi mới'}
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    content: { padding: 16, paddingBottom: 40 },
    card: { marginBottom: 12, backgroundColor: 'white' },
    input: { marginBottom: 12, backgroundColor: 'white' },
    label: { marginBottom: 6, fontWeight: 'bold' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    pickerContainer: { flex: 1 },
    checkboxGroup: { marginBottom: 12 },
    switchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 12 },
    questionCard: { marginBottom: 8, backgroundColor: '#fff' },
    qText: { fontWeight: 'bold', marginVertical: 4 },
    chip: { marginRight: 8, height: 28 },
});
