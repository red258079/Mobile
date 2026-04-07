import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Title, Card, Paragraph, FAB, useTheme, Chip, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import teacherService from '../api/teacherService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TeacherQuestionsScreen() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const navigation = useNavigation<any>();
    const theme = useTheme();

    useEffect(() => {
        loadQuestions();
    }, [page]);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getQuestionBank({
                limit: 20,
                offset: page * 20,
                search: searchQuery
            });
            if (page === 0) {
                setQuestions(data.questions);
            } else {
                setQuestions((prev: any) => [...prev, ...data.questions]);
            }
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to load questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (questions.length < total) {
            setPage(page + 1);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'SingleChoice': return 'Trắc nghiệm (1)';
            case 'MultipleChoice': return 'Trắc nghiệm (n)';
            case 'Essay': return 'Tự luận';
            case 'FillInBlank': return 'Điền từ';
            default: return type;
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'green';
            case 'Medium': return 'orange';
            case 'Hard': return 'red';
            default: return 'gray';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.topRow}>
                    <Chip
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={{ marginRight: 8, backgroundColor: '#f0f0f0' }}
                    >
                        {getTypeLabel(item.question_type)}
                    </Chip>
                    <Chip
                        mode="outlined"
                        textStyle={{ fontSize: 10, color: getDifficultyColor(item.difficulty) }}
                        style={{ borderColor: getDifficultyColor(item.difficulty) }}
                    >
                        {item.difficulty}
                    </Chip>
                </View>

                <Paragraph numberOfLines={3} style={styles.content}>
                    {item.question_content.replace(/<[^>]+>/g, '')}
                </Paragraph>

                <View style={styles.footerRow}>
                    <Text style={styles.subject}>{item.subject_name}</Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Tìm kiếm câu hỏi..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    onSubmitEditing={() => { setPage(0); loadQuestions(); }}
                    style={styles.searchBar}
                />
            </View>

            <FlatList
                data={questions}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.question_id.toString()}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="comment-question-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có câu hỏi nào</Text>
                        </View>
                    )
                }
            />

            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color="white"
                onPress={() => console.log('Create Question')}
            />
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
    },
    card: {
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: 'white',
        elevation: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    content: {
        fontSize: 14,
        marginBottom: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    subject: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        marginTop: 15,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
