import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Surface, Card, Avatar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import notificationService from '../api/notificationService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadNotifications();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.notification_id === id ? { ...n, is_read: 1 } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const getIconForType = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'exam': return 'file-document-outline';
            case 'grade': return 'clipboard-check-outline';
            case 'class': return 'google-classroom';
            case 'alert': return 'alert-circle-outline';
            default: return 'bell-outline';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card
            style={[
                styles.card,
                { backgroundColor: item.is_read ? '#ffffff' : '#e3f2fd' }
            ]}
            onPress={() => handleMarkAsRead(item.notification_id)}
        >
            <Card.Title
                title={item.type || 'Thông báo'}
                titleStyle={{ fontSize: 14, color: '#666', fontWeight: 'bold' }}
                subtitle={new Date(item.created_at).toLocaleString('vi-VN')}
                subtitleStyle={{ fontSize: 12 }}
                left={(props) => <Avatar.Icon {...props} icon={getIconForType(item.type)} size={40} style={{ backgroundColor: item.is_read ? '#eee' : '#2196F3' }} />}
                right={(props) => !item.is_read && <IconButton {...props} icon="circle-small" iconColor="#2196F3" />}
            />
            <Card.Content>
                <Text style={styles.content}>{item.content}</Text>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Surface style={styles.header} elevation={2}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <Button mode="text" onPress={handleMarkAllRead}>Đọc tất cả</Button>
            </Surface>

            {notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.notification_id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="bell-sleep-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        paddingTop: 40, // Status bar spacing
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 8,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        marginTop: -8,
        color: '#333'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
    }
});
