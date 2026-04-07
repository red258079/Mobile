import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, useTheme, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import authService from '../api/authService';
import classService from '../api/classService';
import EditProfileModal from '../components/EditProfileModal';

export default function HomeScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const theme = useTheme();

    const loadData = async () => {
        try {
            const [profileData, classesData] = await Promise.all([
                authService.getProfile(),
                classService.getMyClasses()
            ]);
            setProfile(profileData);
            setClasses(Array.isArray(classesData) ? classesData : []);
        } catch (e) {
            console.log('Failed to load home data', e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Surface style={styles.header} elevation={2}>
                <TouchableOpacity style={styles.profileRow} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
                    {(profile?.user?.avatar || user?.avatar) ? (
                        <Avatar.Image
                            size={60}
                            source={{ uri: (profile?.user?.avatar || user?.avatar).startsWith('http') ? (profile?.user?.avatar || user?.avatar) : `http://192.168.43.25:3000${profile?.user?.avatar || user?.avatar}` }}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    ) : (
                        <Avatar.Text
                            size={60}
                            label={(profile?.user?.fullName || user?.full_name || 'HS').substring(0, 2).toUpperCase()}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    )}
                    <View style={styles.profileText}>
                        <Title style={styles.welcomeText}>Xin chào, {profile?.user?.fullName || user?.full_name || 'Bạn'}</Title>
                        <Text style={styles.roleText}>{user?.role === 'teacher' ? 'GIÁO VIÊN' : 'HỌC VIÊN'}</Text>
                    </View>
                    <Button icon="logout" onPress={logout} mode="text" color="red">Đăng xuất</Button>
                </TouchableOpacity>
            </Surface>

            <EditProfileModal
                visible={editModalVisible}
                onDismiss={() => setEditModalVisible(false)}
                currentUser={user}
                onSuccess={loadData}
            />

            <View style={styles.content}>
                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <Title style={styles.statValue}>{profile?.user?.avgScore != null && !isNaN(Number(profile.user.avgScore)) ? Number(profile.user.avgScore).toFixed(1) : '--'}</Title>
                            <Paragraph>Điểm Trung Bình</Paragraph>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <Title style={styles.statValue}>{classes ? classes.length : '--'}</Title>
                            <Paragraph>Lớp Học</Paragraph>
                        </Card.Content>
                    </Card>
                </View>

                {/* Dashboard Grid */}
                <Title style={styles.sectionTitle}>Chức năng</Title>
                <View style={styles.gridContainer}>
                    {[
                        { title: 'Luyện tập', icon: 'brain', color: '#6200ee', route: 'Practice' },
                        { title: 'Thống kê', icon: 'chart-bar', color: '#03dac6', route: 'Statistics' },
                        { title: 'Lịch sử thi', icon: 'history', color: '#f44336', route: 'History' },
                        { title: 'Lớp học', icon: 'school', color: '#ff9800', route: 'Classes' }, // Navigate to Classes Tab
                    ].map((item, index) => (
                        <Card key={index} style={styles.gridCard} onPress={() => {
                            // @ts-ignore
                            navigation.navigate(item.route);
                        }}>
                            <Card.Content style={styles.gridContent}>
                                <Avatar.Icon size={40} icon={item.icon} style={{ backgroundColor: item.color }} />
                                <Paragraph style={styles.gridLabel}>{item.title}</Paragraph>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                <Title style={styles.sectionTitle}>Bài Thi Hiện Có</Title>
                {/* Check for availableTests (from backend) or availableExams (legacy/fallback) */}
                {(profile?.availableTests || profile?.availableExams)?.length > 0 ? (
                    (profile?.availableTests || profile?.availableExams).map((exam: any) => (
                        <Card key={exam.id || exam.exam_id} style={styles.itemCard} onPress={() => {
                            // @ts-ignore
                            navigation.navigate('ExamDetail', { exam: { ...exam, exam_id: exam.id || exam.exam_id, exam_name: exam.title || exam.exam_name } });
                        }}>
                            <Card.Title
                                title={exam.title || exam.exam_name}
                                subtitle={`${exam.duration} phút • ${exam.status || 'Sẵn sàng'}`}
                                left={(props) => <Avatar.Icon {...props} icon="clipboard-text" />}
                            />
                        </Card>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Hiện không có bài thi nào.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileText: {
        flex: 1,
        marginLeft: 15,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    roleText: {
        color: '#888',
        fontSize: 12,
    },
    content: {
        padding: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 0.48,
        alignItems: 'center',
        borderRadius: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6200ee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
    },
    itemCard: {
        marginBottom: 10,
        borderRadius: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    gridCard: {
        width: '48%',
        marginBottom: 10,
        borderRadius: 12,
    },
    gridContent: {
        alignItems: 'center',
        padding: 5,
    },
    gridLabel: {
        marginTop: 5,
        fontWeight: 'bold',
        fontSize: 12,
    }
});
