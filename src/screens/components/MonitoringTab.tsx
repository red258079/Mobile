import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Searchbar, Chip, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import teacherService from '../../api/teacherService';
import { useFocusEffect } from '@react-navigation/native';

interface MonitoringTabProps {
    examId: number;
}

const MonitoringTab: React.FC<MonitoringTabProps> = ({ examId }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, InProgress, Submitted, not_started

    const loadData = async () => {
        try {
            setLoading(true);
            const result = await teacherService.getExamMonitoring(examId);
            setData(result);
            setFilteredStudents(result.students);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
            // Poll every 30 seconds for real-time monitoring
            const interval = setInterval(loadData, 30000);
            return () => clearInterval(interval);
        }, [examId])
    );

    useEffect(() => {
        if (!data) return;

        let result = data.students;

        // Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter((s: any) =>
                s.full_name?.toLowerCase().includes(lower) ||
                s.email?.toLowerCase().includes(lower)
            );
        }

        // Filter
        if (filterStatus !== 'all') {
            result = result.filter((s: any) => s.status === filterStatus || (filterStatus === 'not_started' && !s.status));
        }

        setFilteredStudents(result);
    }, [searchQuery, filterStatus, data]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'InProgress': return '#3182ce';
            case 'Submitted': return '#38a169';
            case 'AutoSubmitted': return '#d69e2e';
            case 'classes': return '#e53e3e'; // Banned
            default: return '#718096';
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    if (loading && !data) {
        return <ActivityIndicator style={{ marginTop: 20 }} animating={true} size="large" />;
    }

    const { stats } = data || { stats: {} };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <Card style={[styles.statCard, { backgroundColor: '#805AD5' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.total_students || 0}</Text>
                        <Text style={styles.statLabel}>Tổng số</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#3182ce' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.in_progress || 0}</Text>
                        <Text style={styles.statLabel}>Đang làm</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#38a169' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.submitted || 0}</Text>
                        <Text style={styles.statLabel}>Đã nộp</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#718096' }]}>
                    <Card.Content style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.not_started || 0}</Text>
                        <Text style={styles.statLabel}>Chưa thi</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Filter & Search */}
            <Searchbar
                placeholder="Tìm học sinh..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <Chip
                    selected={filterStatus === 'all'}
                    onPress={() => setFilterStatus('all')}
                    style={styles.chip}
                >Tất cả</Chip>
                <Chip
                    selected={filterStatus === 'InProgress'}
                    onPress={() => setFilterStatus('InProgress')}
                    style={styles.chip}
                    icon="pencil"
                >Đang làm</Chip>
                <Chip
                    selected={filterStatus === 'Submitted'}
                    onPress={() => setFilterStatus('Submitted')}
                    style={styles.chip}
                    icon="check"
                >Đã nộp</Chip>
                <Chip
                    selected={filterStatus === 'not_started'}
                    onPress={() => setFilterStatus('not_started')}
                    style={styles.chip}
                    icon="clock-outline"
                >Chưa thi</Chip>
            </ScrollView>

            <Divider style={{ marginVertical: 10 }} />

            {/* Student List */}
            {filteredStudents.map((student: any) => (
                <Card key={student.student_id} style={styles.studentCard}>
                    <Card.Title
                        title={student.full_name}
                        subtitle={student.email}
                        left={(props) => <Avatar.Text {...props} label={student.full_name.substring(0, 2).toUpperCase()} size={40} />}
                        right={(props) => (
                            <View style={[styles.statusBadge, { backgroundColor: student.status_color }]}>
                                <Text style={styles.statusText}>{student.status_text}</Text>
                            </View>
                        )}
                    />
                    <Card.Content>
                        <View style={styles.row}>
                            <Text>Score: {student.score !== null ? student.score : '-'}</Text>
                            {student.status === 'InProgress' && (
                                <Text style={{ color: 'red' }}>Time: {formatTime(student.time_elapsed)}</Text>
                            )}
                        </View>
                        {student.cheating_detected && (
                            <Text style={{ color: 'red', marginTop: 5 }}>⚠️ Phát hiện gian lận</Text>
                        )}
                    </Card.Content>
                </Card>
            ))}

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 10
    },
    statCard: {
        width: '48%',
        marginBottom: 10,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 10
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff'
    },
    statLabel: {
        color: '#fff',
        fontSize: 12
    },
    searchBar: {
        marginBottom: 10,
        elevation: 2
    },
    chipScroll: {
        flexDirection: 'row',
        marginBottom: 10
    },
    chip: {
        marginRight: 8
    },
    studentCard: {
        marginBottom: 8,
        elevation: 2
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5
    }
});

export default MonitoringTab;
