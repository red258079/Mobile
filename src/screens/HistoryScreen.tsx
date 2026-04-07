import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, useTheme, Chip, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import examService from '../api/examService';

export default function HistoryScreen() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = async () => {
        try {
            const allExams = await examService.getExams();
            // Filter only exams that the student has attempted or are completed
            // Since the API doesn't return the score directly in the list, we show the list of attempted exams
            const history = allExams.filter((e: any) => e.my_attempts > 0);
            setExams(history);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card} onPress={() => {
            // @ts-ignore
            navigation.navigate('ExamDetail', { exam: item });
        }}>
            <Card.Title
                title={item.exam_name}
                subtitle={`${item.class_name} • ${item.subject_name || 'N/A'}`}
                left={(props) => <Avatar.Icon {...props} icon="history" style={{ backgroundColor: theme.colors.primary }} />}
                right={(props) => (
                    <View {...props} style={{ marginRight: 16 }}>
                        <Chip icon="check-circle" mode="outlined">Đã thi: {item.my_attempts}</Chip>
                    </View>
                )}
            />
            <Card.Content>
                <Paragraph>Thời lượng: {item.duration} phút</Paragraph>
                <Paragraph style={{ color: '#666', fontSize: 12 }}>
                    Giáo viên: {item.teacher_name}
                </Paragraph>
            </Card.Content>
            <Card.Actions>
                <Button onPress={() => {
                    // @ts-ignore
                    navigation.navigate('ExamDetail', { exam: item });
                }}>Xem chi tiết</Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            {exams.length > 0 ? (
                <FlatList
                    data={exams}
                    keyExtractor={(item) => item.exam_id.toString()}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <Avatar.Icon size={80} icon="history" style={{ backgroundColor: '#ccc', marginBottom: 20 }} />
                    <Title>Chưa có lịch sử thi</Title>
                    <Paragraph style={{ textAlign: 'center', marginTop: 10 }}>
                        Bạn chưa làm bài thi nào. Hãy quay lại trang chủ để bắt đầu làm bài.
                    </Paragraph>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    }
});
