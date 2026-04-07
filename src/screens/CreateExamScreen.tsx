import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { Text, TextInput, Button, Switch, useTheme, Appbar, HelperText, Menu, Divider, List, TouchableRipple, Card, Title } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import teacherService from '../api/teacherService';
import DocumentPicker from 'react-native-document-picker';

export default function CreateExamScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const theme = useTheme();

    const [classId, setClassId] = useState<number | null>(route.params?.classId || null);
    const [className, setClassName] = useState<string>(route.params?.className || '');

    // If no class passed, we need to fetch classes
    const [classes, setClasses] = useState<any[]>([]);
    const [showClassMenu, setShowClassMenu] = useState(false);

    const [examName, setExamName] = useState('');
    const [description, setDescription] = useState('');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [examTime, setExamTime] = useState('08:00');
    const [duration, setDuration] = useState('45');
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!classId) {
            fetchClasses();
        }
    }, [classId]);

    const fetchClasses = async () => {
        try {
            const data = await teacherService.getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách lớp học');
        }
    };

    // Local questions state
    const [localQuestions, setLocalQuestions] = useState<any[]>([]);
    const [importedFile, setImportedFile] = useState<any>(null);

    // Listen for new questions from AddQuestionScreen
    useEffect(() => {
        if (route.params?.newQuestion) {
            setLocalQuestions(prev => [...prev, route.params.newQuestion]);
            // Clear params to avoid duplicate adding if re-focused
            navigation.setParams({ newQuestion: null });
        }
    }, [route.params?.newQuestion]);

    const handleAddQuestion = () => {
        navigation.navigate('AddQuestion', { mode: 'local' });
    };

    const handleRemoveQuestion = (index: number) => {
        setLocalQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handlePickFile = async () => {
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
            setImportedFile(result[0]);
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Lỗi', 'Không thể chọn file');
            }
        }
    };

    const handleSubmit = async () => {
        if (!classId) {
            Alert.alert('Lỗi', 'Vui lòng chọn lớp học');
            return;
        }
        if (!examName || !examDate || !examTime || !duration) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc');
            return;
        }

        // VALIDATION: Must have either manual questions OR an imported file
        if (localQuestions.length === 0 && !importedFile) {
            Alert.alert('Lỗi', 'Vui lòng thêm câu hỏi thủ công HOẶC chọn file Excel để import');
            return;
        }

        try {
            setLoading(true);
            const examData = {
                examName,
                examDate, // String YYYY-MM-DD
                examTime, // String HH:mm
                duration: parseInt(duration),
                description,
                shuffle_questions: shuffleQuestions,
                shuffle_options: shuffleOptions
            };

            // 1. Create Exam
            const response = await teacherService.createExam(classId, examData);
            const examId = response.exam.exam_id;
            const examCode = response.exam.exam_code;
            let message = `Mã bài thi: ${examCode} `;

            // 2. Upload Excel File if selected
            if (importedFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: importedFile.uri,
                        type: importedFile.type,
                        name: importedFile.name,
                    } as any);

                    const importRes = await teacherService.importQuestions(examId, formData);
                    // Append import result to message
                    message += `\n\nImport Excel: ${importRes.message || 'Thành công'} `;
                } catch (importErr: any) {
                    console.error('Import error', importErr);
                    message += `\n\nLỗi Import Excel: ${importErr.message || 'Thất bại'} `;
                }
            }

            // 3. Add Manual Questions if any
            if (localQuestions.length > 0) {
                let addedCount = 0;
                for (const q of localQuestions) {
                    try {
                        // Create question in bank
                        const qRes = await teacherService.createQuestion(q);
                        const qId = qRes.question_id;
                        // Link to exam
                        await teacherService.linkQuestionToExam(examId, qId, 1);
                        addedCount++;
                    } catch (qErr) {
                        console.error('Manual question add error', qErr);
                    }
                }
                message += `\n\nĐã thêm ${addedCount} câu hỏi thủ công.`;
            }

            Alert.alert(
                'Tạo bài thi thành công',
                message,
                [
                    {
                        text: 'Chia sẻ mã',
                        onPress: () => {
                            Share.share({
                                message: `Mã bài thi của bạn là: ${examCode} `,
                            });
                            navigation.goBack();
                        }
                    },
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error: any) {
            console.error('Create exam error', error);
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể tạo bài thi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Tạo bài thi mới" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Class Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Lớp học</Text>
                    {route.params?.classId ? (
                        <TextInput
                            mode="outlined"
                            value={className || `Lớp #${classId} `}
                            disabled
                            style={styles.input}
                        />
                    ) : (
                        <Menu
                            visible={showClassMenu}
                            onDismiss={() => setShowClassMenu(false)}
                            anchor={
                                <TouchableRipple onPress={() => setShowClassMenu(true)}>
                                    <TextInput
                                        mode="outlined"
                                        value={classes.find(c => c.class_id === classId)?.class_name || 'Chọn lớp học'}
                                        editable={false}
                                        right={<TextInput.Icon icon="chevron-down" />}
                                        style={styles.input}
                                    />
                                </TouchableRipple>
                            }
                        >
                            {classes.map(cls => (
                                <Menu.Item
                                    key={cls.class_id}
                                    onPress={() => {
                                        setClassId(cls.class_id);
                                        setShowClassMenu(false);
                                    }}
                                    title={cls.class_name}
                                />
                            ))}
                        </Menu>
                    )}
                </View>

                {/* Exam Info */}
                <TextInput
                    label="Tên bài thi *"
                    value={examName}
                    onChangeText={setExamName}
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Mô tả"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                />

                <View style={styles.row}>
                    <TextInput
                        label="Ngày thi (YYYY-MM-DD) *"
                        value={examDate}
                        onChangeText={setExamDate}
                        mode="outlined"
                        style={[styles.input, { flex: 1, marginRight: 8 }]}
                        placeholder="2024-01-01"
                    />
                    <TextInput
                        label="Giờ thi (HH:mm) *"
                        value={examTime}
                        onChangeText={setExamTime}
                        mode="outlined"
                        style={[styles.input, { flex: 1 }]}
                        placeholder="08:00"
                    />
                </View>
                <HelperText type="info">Định dạng Ngày: Năm-Tháng-Ngày, Giờ: Giờ:Phút (24h)</HelperText>

                <TextInput
                    label="Thời gian làm bài (phút) *"
                    value={duration}
                    onChangeText={setDuration}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                />

                <View style={styles.switchRow}>
                    <Text>Xáo trộn câu hỏi</Text>
                    <Switch value={shuffleQuestions} onValueChange={setShuffleQuestions} color={theme.colors.primary} />
                </View>

                <View style={styles.switchRow}>
                    <Text>Xáo trộn đáp án</Text>
                    <Switch value={shuffleOptions} onValueChange={setShuffleOptions} color={theme.colors.primary} />
                </View>

                {/* Questions Section - Manual or Import */}
                <Divider style={{ marginVertical: 16 }} />
                <Title>Nội dung đề thi</Title>
                <HelperText type="info">Bạn có thể nhập câu hỏi thủ công HOẶC tải lên file Excel.</HelperText>

                {/* Option 1: Manual Questions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold' }}>1. Câu hỏi thủ công ({localQuestions.length})</Text>
                    <Button mode="outlined" onPress={handleAddQuestion} icon="plus">Thêm</Button>
                </View>

                {localQuestions.map((q, index) => (
                    <Card key={index} style={styles.questionCard}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontWeight: 'bold' }}>Câu {index + 1}: {q.question_type}</Text>
                                <TouchableRipple onPress={() => handleRemoveQuestion(index)}>
                                    <Text style={{ color: 'red' }}>Xóa</Text>
                                </TouchableRipple>
                            </View>
                            <Text numberOfLines={2} style={{ marginTop: 4 }}>{q.question_content}</Text>
                        </Card.Content>
                    </Card>
                ))}

                <Divider style={{ marginVertical: 10 }} />

                {/* Option 2: Import File */}
                <View style={{ marginTop: 5, marginBottom: 15 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>2. Import từ file Excel/CSV</Text>
                    <Button
                        mode={importedFile ? "contained" : "outlined"}
                        icon={importedFile ? "check" : "file-excel"}
                        onPress={handlePickFile}
                        style={{ borderColor: '#6200ee' }}
                        textColor={importedFile ? 'white' : '#6200ee'}
                        buttonColor={importedFile ? 'green' : undefined}
                    >
                        {importedFile ? `Đã chọn: ${importedFile.name} ` : 'Chọn file Excel để upload'}
                    </Button>
                    {importedFile && (
                        <TouchableRipple onPress={() => setImportedFile(null)} style={{ alignSelf: 'flex-end', marginTop: 5 }}>
                            <Text style={{ color: 'red' }}>Xóa file</Text>
                        </TouchableRipple>
                    )}
                </View>


                <Divider style={{ marginVertical: 16 }} />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    {loading ? 'Đang xử lý...' : 'Lưu bài thi'}
                </Button>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 10,
    },
    label: {
        marginBottom: 4,
        color: '#666',
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 8,
    },
    button: {
        marginTop: 10,
        paddingVertical: 6,
    },
    questionCard: {
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderLeftWidth: 4,
        borderLeftColor: '#6200ee'
    }
});
