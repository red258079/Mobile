import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 40 - (COLUMN_COUNT - 1) * 15) / COLUMN_COUNT;

export default function TeacherHomeScreen() {
    const { user, logout } = useAuth();
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const features = [
        {
            title: 'Lớp học',
            icon: 'google-classroom',
            color: '#4CAF50',
            route: 'TeacherClasses',
            description: 'Quản lý các lớp học'
        },
        {
            title: 'Ngân hàng câu hỏi',
            icon: 'file-question',
            color: '#2196F3',
            route: 'TeacherQuestions',
            description: 'Kho câu hỏi hệ thống'
        },
        {
            title: 'Chấm bài',
            icon: 'check-decagram',
            color: '#E91E63',
            route: 'TeacherGrading',
            description: 'Chấm điểm tự luận'
        },
        {
            title: 'Tài liệu',
            icon: 'folder-upload',
            color: '#FF9800',
            route: 'TeacherMaterials',
            description: 'Quản lý tài liệu học tập'
        },
        {
            title: 'Thống kê',
            icon: 'chart-box',
            color: '#9C27B0',
            route: 'TeacherStatistics',
            description: 'Báo cáo kết quả'
        },
        {
            title: 'Giám sát thi',
            icon: 'eye',
            color: '#F44336',
            route: 'TeacherMonitoring',
            description: 'Theo dõi thi trực tuyến'
        }
    ];

    const renderFeatureItem = (item: any, index: number) => (
        <Card
            key={index}
            style={[styles.featureItem]}
            onPress={() => navigation.navigate(item.route)}
            mode="elevated"
            contentStyle={{ borderRadius: 16 }}
        >
            <View style={{ alignItems: 'center', padding: 20 }}>
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <MaterialCommunityIcons name={item.icon} size={30} color="white" />
                </View>
                <Title style={styles.featureTitle}>{item.title}</Title>
                <Paragraph style={styles.featureDesc}>{item.description}</Paragraph>
            </View>
        </Card>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.name}>{user?.full_name || 'Giáo viên'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={{ marginRight: 15 }}
                    >
                        <MaterialCommunityIcons name="bell-outline" size={28} color="#666" />
                        {/* Badge could be added here */}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={logout}
                        style={{ marginRight: 15 }}
                    >
                        <MaterialCommunityIcons name="logout" size={28} color="#F44336" />
                    </TouchableOpacity>
                    <Avatar.Text
                        size={50}
                        label={user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'GV'}
                        style={{ backgroundColor: theme.colors.primary }}
                    />
                </View>
            </View>

            <View style={styles.content}>
                <Title style={styles.sectionTitle}>Chức năng quản lý</Title>
                <View style={styles.featureGrid}>
                    {features.map(renderFeatureItem)}
                </View>

                <Title style={[styles.sectionTitle, { marginTop: 25 }]}>Hoạt động gần đây</Title>
                <Card style={styles.recentActivityCard}>
                    <Card.Content>
                        <View style={styles.activityItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                            <Paragraph style={{ marginLeft: 10 }}>Chưa có hoạt động nào gần đây.</Paragraph>
                        </View>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    greeting: {
        fontSize: 16,
        color: '#666',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureItem: {
        width: ITEM_WIDTH,
        marginBottom: 20,
        borderRadius: 20,
        elevation: 4,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 16,
    },
    recentActivityCard: {
        borderRadius: 12,
        backgroundColor: 'white',
        elevation: 1,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    }
});
