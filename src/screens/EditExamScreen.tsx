import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, Title, ActivityIndicator, useTheme } from 'react-native-paper';
import teacherService from '../api/teacherService';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
    examId: number;
    examData?: any;
}

const EditExamScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    const { examId, examData } = (route.params as RouteParams) || {};

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(''); // Text format YYYY-MM-DD
    const [time, setTime] = useState(''); // Text format HH:mm
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (examData) {
            setName(examData.exam_name || '');
            setDescription(examData.description || '');

            if (examData.start_time) {
                const startTime = new Date(examData.start_time);
                // Simple format YYYY-MM-DD
                setDate(startTime.toISOString().split('T')[0]);
                // Simple format HH:mm
                setTime(startTime.toTimeString().substring(0, 5));
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setTime('08:00');
            }

            setDuration(examData.duration ? String(examData.duration) : '');
        }
    }, [examData]);

    const handleSave = async () => {
        if (!name || !duration || !date || !time) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);

            const updateData = {
                examName: name,
                description,
                examDate: date,
                examTime: time,
                duration: parseInt(duration),
            };

            await teacherService.updateExam(examId, updateData);

            Alert.alert('Thành công', 'Cập nhật bài thi thành công', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }
            ]);

        } catch (error: any) {
            console.error('Update error:', error);
            Alert.alert('Lỗi', 'Cập nhật thất bại: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.title}>Chỉnh sửa bài thi</Title>

                    <TextInput
                        label="Tên bài thi"
                        value={name}
                        onChangeText={setName}
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
                        <View style={styles.halfInput}>
                            <TextInput
                                label="Ngày thi (YYYY-MM-DD)"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                right={<TextInput.Icon icon="calendar" disabled />}
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.halfInput}>
                            <TextInput
                                label="Giờ (HH:mm)"
                                value={time}
                                onChangeText={setTime}
                                mode="outlined"
                                right={<TextInput.Icon icon="clock-outline" disabled />}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <TextInput
                        label="Thời gian làm bài (phút)"
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        icon="content-save"
                    >
                        Lưu thay đổi
                    </Button>

                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 4
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
        fontSize: 22
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    halfInput: {
        width: '48%'
    },
    button: {
        marginTop: 10,
        paddingVertical: 6
    }
});

export default EditExamScreen;
