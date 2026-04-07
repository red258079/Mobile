import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text, Title, Card, Paragraph, FAB, useTheme, Chip, Searchbar, Portal, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import teacherService from '../api/teacherService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TeacherExamsScreen() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [openFAB, setOpenFAB] = useState(false);
    const navigation = useNavigation<any>();
    const theme = useTheme();

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getAllExams();
            setExams(data);
        } catch (error) {
            console.error('Failed to load exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'upcoming': return 'orange';
            case 'completed': return 'gray';
            case 'draft': return 'blue';
            default: return 'black';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Đang diễn ra';
            case 'upcoming': return 'Sắp tới';
            case 'completed': return 'Đã kết thúc';
            case 'draft': return 'Nháp';
            default: return status;
        }
    };

    const filteredExams = exams.filter((e: any) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.class_name && e.class_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDeleteExam = (examId: number) => {
        Alert.alert(
            'Xóa bài thi',
            'Bạn có chắc chắn muốn xóa bài thi này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await teacherService.deleteExam(examId);
                            Alert.alert('Thành công', 'Đã xóa bài thi');
                            loadExams(); // Refresh list
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Lỗi', 'Không thể xóa bài thi');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('TeacherExamDetail', { examId: item.exam_id })}>
            <Card.Content>
                <View style={styles.topRow}>
                    <Chip
                        icon="clock-outline"
                        mode="outlined"
                        style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
                        textStyle={{ color: getStatusColor(item.status), fontSize: 11 }}
                    >
                        {getStatusLabel(item.status)}
                    </Chip>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.date, { marginRight: 8 }]}>{new Date(item.start_time).toLocaleDateString()}</Text>
                        <IconButton
                            icon="delete"
                            iconColor={theme.colors.error}
                            size={20}
                            style={{ margin: 0 }}
                            onPress={() => handleDeleteExam(item.exam_id)}
                        />
                    </View>
                </View>

                <Title style={styles.examTitle}>{item.title}</Title>
                <Paragraph style={styles.className}>{item.class_name || 'Chưa gán lớp'}</Paragraph>

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="timer-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{item.duration} phút</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="file-document-edit-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{item.submissions || 0} bài nộp</Text>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Tìm kiếm bài thi..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredExams}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.exam_id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="file-question-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có bài thi nào</Text>
                            <Text style={styles.emptySubText}>Tạo bài thi mới để học sinh làm bài</Text>
                        </View>
                    }
                />
            )}

            <Portal>
                <FAB.Group
                    open={openFAB}
                    visible={true}
                    icon={openFAB ? 'close' : 'plus'}
                    actions={[
                        {
                            icon: 'robot',
                            label: 'Tạo bằng AI',
                            onPress: () => navigation.navigate('GenerateAI'),
                            style: { backgroundColor: '#E0F7FA' },
                            color: '#006064'
                        },
                        {
                            icon: 'pencil',
                            label: 'Tạo thủ công',
                            onPress: () => navigation.navigate('CreateExam'),
                            style: { backgroundColor: '#E8F5E9' },
                            color: '#1B5E20'
                        },
                    ]}
                    onStateChange={({ open }) => setOpenFAB(open)}
                    onPress={() => {
                        if (openFAB) {
                            // do something if the speed dial is open
                        }
                    }}
                />
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        elevation: 0,
        backgroundColor: '#f0f0f0',
        height: 40,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: 'white',
        elevation: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusChip: {
        height: 28,
        backgroundColor: 'transparent',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    className: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    infoText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 13,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
