import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Button, Chip, Avatar, Divider, ActivityIndicator, Paragraph, useTheme, IconButton, List } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import classService from '../api/classService';
import teacherService from '../api/teacherService';
import { useAuth } from '../context/AuthContext';
import DocumentPicker from 'react-native-document-picker';

type ClassDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClassDetail'>;
type ClassDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetail'>;

// Student Score Card Component with Expandable Details
const StudentScoreCard = ({ student }: { student: any }) => {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();

    const hasExams = student.exam_scores && student.exam_scores.length > 0;

    return (
        <Card style={{ marginBottom: 10 }}>
            <TouchableOpacity onPress={() => hasExams && setExpanded(!expanded)}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {student.avatar ? (
                            <Avatar.Image
                                size={40}
                                source={{ uri: student.avatar.startsWith('http') ? student.avatar : `http://192.168.43.25:3000${student.avatar}` }}
                                style={{ marginRight: 12, backgroundColor: theme.colors.primaryContainer }}
                            />
                        ) : (
                            <Avatar.Text
                                size={40}
                                label={student.full_name ? student.full_name.substring(0, 2).toUpperCase() : '??'}
                                style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12 }}
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{student.full_name}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>{student.email}</Text>
                        </View>
                        <View style={{ alignItems: 'center', marginRight: 12 }}>
                            <Text style={{ fontSize: 10, color: '#6B7280' }}>Điểm TB</Text>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>
                                {student.avg_score != null ? student.avg_score.toFixed(1) : 'N/A'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: '#6B7280' }}>Bài thi</Text>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>
                                {student.exams_completed || 0}
                            </Text>
                        </View>
                        {hasExams && (
                            <IconButton
                                icon={expanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                            />
                        )}
                    </View>
                </Card.Content>
            </TouchableOpacity>

            {expanded && hasExams && (
                <Card.Content style={{ paddingTop: 0 }}>
                    <Divider style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Chi tiết điểm từng bài thi:</Text>
                    {student.exam_scores.map((exam: any, index: number) => (
                        <View key={`${exam.exam_id}-${index}`} style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                            borderBottomWidth: index < student.exam_scores.length - 1 ? 1 : 0,
                            borderBottomColor: '#E5E7EB'
                        }}>
                            <Text style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{exam.exam_name}</Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: exam.score != null ? '#10B981' : '#9CA3AF',
                                marginLeft: 8
                            }}>
                                {exam.score != null ? Number(exam.score).toFixed(1) : 'Chưa chấm'}
                            </Text>
                        </View>
                    ))}
                </Card.Content>
            )}
        </Card>
    );
};

export default function ClassDetailScreen() {
    const route = useRoute<ClassDetailScreenRouteProp>();
    const navigation = useNavigation<ClassDetailScreenNavigationProp>();
    const theme = useTheme();
    const { user } = useAuth();

    const passedClassData = route.params?.classData || {};

    const [classInfo, setClassInfo] = useState<any>(passedClassData);
    const [members, setMembers] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!passedClassData.class_id) return;

        try {
            if (!refreshing) setLoading(true);

            // Fetch class details
            const isTeacher = user?.role?.toLowerCase() === 'teacher';
            console.log('📋 ClassDetailScreen - User role check:', {
                userRole: user?.role,
                isTeacher,
                classId: passedClassData.class_id
            });

            const service = isTeacher ? teacherService : classService;
            const data = await service.getClassDetails(passedClassData.class_id);

            setClassInfo({
                ...passedClassData,
                teacher_name: data.teacher,
                announcements: data.announcements,
                class_code: data.class_code,
                subject_name: data.subject_name
            });

            setMembers(data.students || []);

            setExams(data.tests ? data.tests.map((test: any) => ({
                exam_id: test.test_id || test.exam_id,
                exam_name: test.title || test.exam_name,
                duration: test.duration,
                total_questions: test.total_questions || 0,
                start_time: test.start_time,
                status: test.status
            })) : []);

            // Fetch materials
            const materialsData = await service.getClassMaterials(passedClassData.class_id);
            setMaterials(materialsData || []);

        } catch (error) {
            console.error('Failed to load class details', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [passedClassData.class_id, refreshing]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // loadData will be called due to refreshing change or we can call it directly
        // But better to just update refreshing state and let effect handle? 
        // Or simpler: just call loadData.
        // Let's modify loadData to not depend on refreshing state for logic, but just set it.
        // Actually, simpler approach for manual refresh:
        loadData().then(() => setRefreshing(false));
    }, [loadData]);

    const handleDownloadMaterial = async (material: any) => {
        try {
            const token = await AsyncStorage.getItem('jwt_token');
            const downloadUrl = `${API_BASE_URL}/teacher/materials/${material.material_id}/download?token=${token}`;

            const supported = await Linking.canOpenURL(downloadUrl);
            if (supported) {
                await Linking.openURL(downloadUrl);
            } else {
                Alert.alert("Lỗi", "Không thể mở liên kết tải xuống này.");
            }
        } catch (error) {
            console.error("Download error", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi tải tài liệu.");
        }
    };

    const handleTakeExam = (exam: any) => {
        navigation.navigate('ExamDetail', { exam });
    };

    const handleUploadMaterial = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.video, DocumentPicker.types.images, DocumentPicker.types.pdf, DocumentPicker.types.zip, DocumentPicker.types.plainText, DocumentPicker.types.doc, DocumentPicker.types.docx, DocumentPicker.types.ppt, DocumentPicker.types.pptx, DocumentPicker.types.xls, DocumentPicker.types.xlsx],
            });

            if (!result || result.length === 0) return;
            const file = result[0];

            setLoading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);
            formData.append('description', 'Uploaded via mobile app');
            formData.append('title', file.name);

            // Use passedClassData.class_id or classInfo.class_id
            await teacherService.uploadMaterial(passedClassData.class_id, formData);

            Alert.alert('Thành công', 'Đã upload tài liệu thành công');
            loadData(); // Refresh list
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled
            } else {
                console.error('Upload error', err);
                Alert.alert('Lỗi', 'Không thể upload tài liệu. ' + (err instanceof Error ? err.message : ''));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = () => {
        (navigation as any).navigate('CreateExam', {
            classId: passedClassData.class_id,
            className: passedClassData.class_name
        });
    };

    if (loading && !refreshing && !exams.length && !materials.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.classTitle}>{classInfo.class_name || 'Đang tải...'}</Title>
                    <Text style={styles.subtitle}>{classInfo.subject_name || 'Môn học'}</Text>

                    <Divider style={{ marginVertical: 10 }} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Avatar.Icon size={32} icon="account" style={{ backgroundColor: theme.colors.primary }} />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={styles.label}>Giáo viên</Text>
                                <Text style={styles.value}>{classInfo.teacher_name || 'Chưa cập nhật'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Avatar.Icon size={32} icon="identifier" style={{ backgroundColor: '#e0e0e0' }} />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={styles.label}>Mã lớp</Text>
                                <Text style={styles.value}>{classInfo.class_code || classInfo.class_id}</Text>
                            </View>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <Divider style={styles.divider} />

            {/* Student Scores Table (Teachers Only) */}
            {user?.role?.toLowerCase() === 'teacher' && members.length > 0 && (
                <View style={styles.section}>
                    <Title style={styles.sectionTitle}>Bảng điểm học sinh</Title>
                    {members.map((student: any) => (
                        <StudentScoreCard key={student.user_id} student={student} />
                    ))}
                </View>
            )}

            <Divider style={styles.divider} />

            {/* Members Section */}
            {members.length > 0 && (
                <View style={styles.section}>
                    <Title style={styles.sectionTitle}>Thành viên lớp ({members.length})</Title>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersRow}>
                        {members.map((member: any) => (
                            <View key={member.user_id} style={styles.memberItem}>
                                {member.avatar ? (
                                    <Avatar.Image
                                        size={40}
                                        source={{ uri: member.avatar.startsWith('http') ? member.avatar : `http://192.168.43.25:3000${member.avatar}` }}
                                        style={{ backgroundColor: theme.colors.primaryContainer }}
                                    />
                                ) : (
                                    <Avatar.Text
                                        size={40}
                                        label={member.full_name ? member.full_name.substring(0, 2).toUpperCase() : '??'}
                                        style={{ backgroundColor: theme.colors.primaryContainer }}
                                    />
                                )}
                                <Text style={styles.memberName} numberOfLines={1}>{member.full_name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Divider style={styles.divider} />

            {/* Exams Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Title style={styles.sectionTitle}>Danh sách bài thi</Title>
                        <Chip style={{ marginLeft: 8 }}>{exams.length || 0}</Chip>
                    </View>
                    {user?.role?.toLowerCase() === 'teacher' && (
                        <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={24} onPress={handleCreateExam} />
                    )}
                </View>

                {exams.length > 0 ? (
                    exams.map((exam: any) => (
                        <Card key={exam.exam_id} style={styles.examCard} onPress={() => {
                            if (user?.role?.toLowerCase() === 'teacher') {
                                (navigation as any).navigate('TeacherExamDetail', { examId: exam.exam_id });
                            } else {
                                handleTakeExam(exam);
                            }
                        }}>
                            <Card.Title
                                title={exam.exam_name}
                                subtitle={`${exam.duration || 60} phút • ${exam.total_questions || 'N/A'} câu hỏi`}
                                left={(props) => <Avatar.Icon {...props} icon="clipboard-text" style={{ backgroundColor: '#ff9800' }} />}
                                right={(props) => (
                                    <View {...props} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {user?.role?.toLowerCase() === 'teacher' ? (
                                            <IconButton
                                                icon="delete"
                                                iconColor={theme.colors.error}
                                                size={20}
                                                onPress={() => {
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
                                                                        await teacherService.deleteExam(exam.exam_id);
                                                                        Alert.alert('Thành công', 'Đã xóa bài thi');
                                                                        loadData(); // Refresh list
                                                                    } catch (error) {
                                                                        console.error(error);
                                                                        Alert.alert('Lỗi', 'Không thể xóa bài thi');
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Button mode="text" labelStyle={{ color: theme.colors.primary }}>Làm bài</Button>
                                        )}
                                    </View>
                                )}
                            />
                        </Card>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Paragraph>Chưa có bài thi nào trong lớp này.</Paragraph>
                    </View>
                )}
            </View>

            <Divider style={styles.divider} />

            {/* Materials Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Title style={styles.sectionTitle}>Tài liệu học tập</Title>
                        <Chip style={{ marginLeft: 8 }}>{materials.length || 0}</Chip>
                    </View>
                    {user?.role?.toLowerCase() === 'teacher' && (
                        <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={24} onPress={handleUploadMaterial} />
                    )}
                </View>

                {materials.length > 0 ? (
                    materials.map((material) => (
                        <Card key={material.material_id} style={styles.card} onPress={() => handleDownloadMaterial(material)}>
                            <Card.Title
                                title={material.title}
                                subtitle={`${(material.file_size / 1024 / 1024).toFixed(2)} MB • ${new Date(material.upload_date).toLocaleDateString()}`}
                                left={(props) => <Avatar.Icon {...props} icon="file-document-outline" style={{ backgroundColor: '#FF9800', color: 'white' }} />}
                                right={(props) => <IconButton {...props} icon="download" onPress={() => handleDownloadMaterial(material)} />}
                            />
                        </Card>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Paragraph>Chưa có tài liệu nào.</Paragraph>
                    </View>
                )}
            </View>
        </ScrollView >
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
    headerCard: {
        margin: 15,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: 'white'
    },
    classTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
        marginBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 10,
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#888',
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    divider: {
        height: 10,
        backgroundColor: '#eee',
    },
    section: {
        padding: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    membersRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    memberItem: {
        alignItems: 'center',
        marginRight: 15,
        width: 60,
    },
    memberName: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    examCard: {
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: 'white',
        elevation: 1,
    },
    card: {
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: 'white',
        elevation: 1,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    studentScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    studentScoreName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    studentScoreEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    studentScoreStats: {
        alignItems: 'center',
        marginLeft: 12,
        minWidth: 60,
    },
    studentScoreLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    studentScoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginTop: 2,
    }
});
