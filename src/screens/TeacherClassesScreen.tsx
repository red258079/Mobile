import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { Text, Title, Card, Paragraph, FAB, useTheme, Chip, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import teacherService from '../api/teacherService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TeacherClassesScreen() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation<any>();
    const theme = useTheme();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getClasses();
            console.log('Classes loaded:', data.length);
            setClasses(data);
        } catch (error: any) {
            console.error('Failed to load classes:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách lớp học: ' + (error.message || 'Lỗi không xác định'));
        } finally {
            setLoading(false);
        }
    };

    const filteredClasses = classes.filter((c: any) =>
        c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.class_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('ClassDetail', { classData: item })}>
            <Card.Content>
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <Text style={{ fontSize: 24 }}>{item.icon || '📚'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Title>{item.class_name}</Title>
                        <Paragraph style={styles.classCode}>{item.class_code}</Paragraph>
                    </View>
                    <Chip
                        icon={item.status === 'active' ? 'check-circle' : 'archive'}
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={{ borderColor: item.status === 'active' ? 'green' : 'gray' }}
                    >
                        {item.status.toUpperCase()}
                    </Chip>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="account-group" size={20} color="#666" />
                        <Text style={styles.statText}>{item.students || 0} Học sinh</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="file-document-outline" size={20} color="#666" />
                        <Text style={styles.statText}>{item.exams || 0} Bài thi</Text>
                    </View>
                </View>

                {item.description ? (
                    <Paragraph numberOfLines={1} style={styles.description}>{item.description}</Paragraph>
                ) : null}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Tìm kiếm lớp học..."
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
                    data={filteredClasses}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.class_id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="book-open-variant" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
                            <Text style={styles.emptySubText}>Tạo lớp học mới để bắt đầu</Text>
                        </View>
                    }
                />
            )}

            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color="white"
                onPress={() => console.log('Create Class')}
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
        paddingBottom: 80,
    },
    card: {
        marginBottom: 15,
        borderRadius: 12,
        backgroundColor: 'white',
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    classCode: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    statText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 13,
    },
    description: {
        marginTop: 10,
        color: '#888',
        fontStyle: 'italic',
        fontSize: 12,
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
