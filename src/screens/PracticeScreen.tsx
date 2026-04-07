import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, TextInput, useTheme, ActivityIndicator, RadioButton, Menu, Divider, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import practiceService from '../api/practiceService';

export default function PracticeScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'

    // List Data
    const [exams, setExams] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    // Create Data
    const [materials, setMaterials] = useState<any[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    // Form Data
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [prompt, setPrompt] = useState('');
    const [aiModel, setAiModel] = useState<'groq' | 'gemini'>('groq');
    const [creating, setCreating] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const loadExams = async () => {
        setLoadingList(true);
        try {
            const data = await practiceService.getPracticeExams();
            setExams(data.exams || []);
        } catch (error) {
            console.error('Failed to load practice exams', error);
        } finally {
            setLoadingList(false);
        }
    };

    const loadMaterials = async () => {
        setLoadingMaterials(true);
        try {
            const data = await practiceService.getMaterials();
            setMaterials(data || []);
        } catch (error) {
            console.error('Failed to load materials', error);
        } finally {
            setLoadingMaterials(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'list') {
            loadExams();
        } else {
            loadMaterials();
        }
    }, [viewMode]);

    const handleCreate = async () => {
        if (!selectedMaterial) {
            Alert.alert('Lỗi', 'Vui lòng chọn tài liệu');
            return;
        }
        if (!prompt.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập yêu cầu (Prompt)');
            return;
        }

        setCreating(true);
        try {
            await practiceService.createPracticeExam({
                material_id: selectedMaterial.material_id,
                prompt: prompt,
                ai_model: aiModel
            });
            Alert.alert('Thành công', 'Đã tạo đề luyện tập thành công!');
            setPrompt('');
            setSelectedMaterial(null);
            setViewMode('list');
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể tạo đề luyện tập');
        } finally {
            setCreating(false);
        }
    };

    const renderExamItem = ({ item }: { item: any }) => (
        <Card style={styles.card} onPress={() => {
            // @ts-ignore
            navigation.navigate('TakeExam', {
                examId: item.practice_exam_id,
                isPractice: true,
                title: item.exam_name
            });
        }}>
            <Card.Title
                title={item.exam_name}
                subtitle={`${item.total_questions} câu hỏi • ${item.ai_provider}`}
                left={(props) => <Button {...props} icon="brain" mode="text" labelStyle={{ fontSize: 24 }}>{''}</Button>}
            />
            <Card.Content>
                <Paragraph>Best Score: {item.best_score || '--'}</Paragraph>
                <Paragraph style={{ fontSize: 12, color: '#888' }}>
                    Tạo ngày: {new Date(item.created_at).toLocaleDateString()}
                </Paragraph>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <SegmentedButtons
                    value={viewMode}
                    onValueChange={setViewMode}
                    buttons={[
                        { value: 'list', label: 'Danh sách đề' },
                        { value: 'create', label: 'Tạo đề mới' },
                    ]}
                />
            </View>

            {viewMode === 'list' ? (
                loadingList ? (
                    <ActivityIndicator style={{ marginTop: 20 }} size="large" />
                ) : (
                    <FlatList
                        data={exams}
                        keyExtractor={(item) => item.practice_exam_id.toString()}
                        renderItem={renderExamItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text>Chưa có đề luyện tập nào.</Text>
                            </View>
                        }
                    />
                )
            ) : (
                <ScrollView contentContainerStyle={styles.formContent}>
                    <Title style={styles.sectionTitle}>Cấu hình đề luyện tập</Title>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>1. Chọn tài liệu nguồn:</Text>
                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                                    {selectedMaterial ? selectedMaterial.title : 'Chọn tài liệu...'}
                                </Button>
                            }
                        >
                            {loadingMaterials ? (
                                <Menu.Item title="Đang tải..." />
                            ) : materials.length > 0 ? (
                                materials.map((m) => (
                                    <Menu.Item
                                        key={m.material_id}
                                        onPress={() => {
                                            setSelectedMaterial(m);
                                            setMenuVisible(false);
                                        }}
                                        title={m.title}
                                    />
                                ))
                            ) : (
                                <Menu.Item title="Không có tài liệu nào" />
                            )}
                        </Menu>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>2. Nhập yêu cầu (Prompt):</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Ví dụ: Tạo 10 câu trắc nghiệm khó về..."
                            multiline
                            numberOfLines={4}
                            value={prompt}
                            onChangeText={setPrompt}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>3. Chọn mô hình AI:</Text>
                        <RadioButton.Group onValueChange={value => setAiModel(value as 'groq' | 'gemini')} value={aiModel}>
                            <View style={styles.radioRow}>
                                <RadioButton value="groq" />
                                <Text>Groq (Nhanh)</Text>
                            </View>
                            <View style={styles.radioRow}>
                                <RadioButton value="gemini" />
                                <Text>Gemini (Thông minh)</Text>
                            </View>
                        </RadioButton.Group>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        loading={creating}
                        disabled={creating}
                        style={styles.createButton}
                    >
                        Tạo đề ngay
                    </Button>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    listContent: {
        padding: 16,
    },
    formContent: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    createButton: {
        marginTop: 10,
        paddingVertical: 5,
    },
    sectionTitle: {
        marginBottom: 20,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
    }
});
