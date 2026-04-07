import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Title, FAB, Portal, Dialog, TextInput, Button, ActivityIndicator, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import classService from '../api/classService';
import { RootStackParamList } from '../types/navigation';

type ClassesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ClassesScreen() {
    const navigation = useNavigation<ClassesScreenNavigationProp>();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [joinVisible, setJoinVisible] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);

    const fetchClasses = async () => {
        try {
            const data = await classService.getMyClasses();
            setClasses(data);
        } catch (e) {
            console.error('Fetch classes error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchClasses();
        setRefreshing(false);
    };

    const handleJoinClass = async () => {
        if (!classCode) return;
        setJoinLoading(true);
        try {
            await classService.joinClass(classCode);
            setJoinVisible(false);
            setClassCode('');
            fetchClasses();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to join class');
        } finally {
            setJoinLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('ClassDetail', { classData: item })}>
            <Card.Title
                title={item.class_name}
                subtitle={item.subject_name}
                left={(props) => <Avatar.Icon {...props} icon="google-classroom" />}
            />
            <Card.Content>
                <Text variant="bodySmall">ID: {item.class_id}</Text>
                <Text variant="bodySmall">Teacher: {item.teacher_name}</Text>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator animating={true} style={styles.loader} />
            ) : (
                <FlatList
                    data={classes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.class_id.toString()}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>Bạn chưa tham gia lớp học nào.</Text>}
                />
            )}

            <Portal>
                <Dialog visible={joinVisible} onDismiss={() => setJoinVisible(false)}>
                    <Dialog.Title>Tham gia lớp học</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Mã lớp"
                            value={classCode}
                            onChangeText={setClassCode}
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setJoinVisible(false)} disabled={joinLoading}>Hủy</Button>
                        <Button onPress={handleJoinClass} loading={joinLoading} disabled={joinLoading}>Tham gia</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setJoinVisible(true)}
                label="Tham gia lớp"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loader: {
        flex: 1,
    },
    list: {
        padding: 10,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 10,
        borderRadius: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
    }
});
