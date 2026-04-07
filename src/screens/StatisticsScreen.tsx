import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, ActivityIndicator } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import statisticsService from '../api/statisticsService';

export default function StatisticsScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const screenWidth = Dimensions.get('window').width;

    const loadStats = async () => {
        try {
            setError(null);
            const data = await statisticsService.getStudentStatistics();
            setStats(data);
        } catch (error: any) {
            console.error('Failed to load statistics', error);
            setError(error.response?.data?.error || error.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error || !stats) {
        return (
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error || 'Không có dữ liệu thống kê'}</Text>
                    <Paragraph style={styles.errorHint}>
                        Hãy thử làm một số bài thi để có dữ liệu hiển thị.
                    </Paragraph>
                </View>
            </ScrollView>
        );
    }

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    // Prepare Line Chart Data (Score Trend)
    const trendLabels = stats?.score_trend?.map((t: any) => t.label) || [];
    const trendData = stats?.score_trend?.map((t: any) => Number(t.avg_score) || 0) || [];

    const lineChartData = {
        labels: trendLabels.length > 0 ? trendLabels : ['No Data'],
        datasets: [
            {
                data: trendData.length > 0 ? trendData : [0],
                color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Điểm trung bình theo ngày"]
    };

    // Prepare Pie Chart Data (Distribution)
    const distributionData = [
        {
            name: "Giỏi",
            population: stats?.distribution?.['Giỏi (8-10)'] || 0,
            color: "#4caf50",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        },
        {
            name: "Khá",
            population: stats?.distribution?.['Khá (6.5-8)'] || 0,
            color: "#2196f3",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        },
        {
            name: "TB",
            population: stats?.distribution?.['Trung bình (5-6.5)'] || 0,
            color: "#ff9800",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        },
        {
            name: "Yếu",
            population: stats?.distribution?.['Yếu (<5)'] || 0,
            color: "#f44336",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        }
    ].filter(d => d.population > 0);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <Card style={[styles.card, { marginRight: 8 }]}>
                    <Card.Content>
                        <Title style={{ color: theme.colors.primary, fontSize: 24, fontWeight: 'bold' }}>
                            {stats?.avg_score || '--'}
                        </Title>
                        <Paragraph>Điểm Trung Bình</Paragraph>
                    </Card.Content>
                </Card>
                <Card style={[styles.card, { marginLeft: 8 }]}>
                    <Card.Content>
                        <Title style={{ color: '#03dac6', fontSize: 24, fontWeight: 'bold' }}>
                            {stats?.completed_exams || 0}
                        </Title>
                        <Paragraph>Bài thi hoàn thành</Paragraph>
                    </Card.Content>
                </Card>
            </View>

            <View style={styles.summaryContainer}>
                <Card style={[styles.card, { marginRight: 8 }]}>
                    <Card.Content>
                        <Title style={{ color: '#4caf50', fontSize: 24, fontWeight: 'bold' }}>
                            {stats?.highest_score || '--'}
                        </Title>
                        <Paragraph>Điểm Cao Nhất</Paragraph>
                    </Card.Content>
                </Card>
                <Card style={[styles.card, { marginLeft: 8 }]}>
                    <Card.Content>
                        <Title style={{ color: '#ff9800', fontSize: 24, fontWeight: 'bold' }}>
                            {stats?.pass_rate || 0}%
                        </Title>
                        <Paragraph>Tỷ lệ Đạt</Paragraph>
                    </Card.Content>
                </Card>
            </View>

            {/* Score Trend Chart */}
            <Title style={styles.sectionTitle}>Biểu đồ phát triển</Title>
            <View style={{ alignItems: 'center' }}>
                <LineChart
                    data={lineChartData}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>

            {/* Distribution Chart */}
            {distributionData.length > 0 && (
                <>
                    <Title style={styles.sectionTitle}>Phân bố điểm số</Title>
                    <PieChart
                        data={distributionData}
                        width={screenWidth - 32}
                        height={220}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                </>
            )}

            {/* Subject Stats List */}
            <Title style={styles.sectionTitle}>Thống kê theo môn</Title>
            {stats?.subject_stats?.map((subject: any, index: number) => (
                <Card key={index} style={styles.listCard}>
                    <Card.Title
                        title={subject.subject_name}
                        subtitle={`${subject.exam_count} bài thi`}
                        right={(props) => (
                            <View {...props} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>
                                    {subject.avg_score}
                                </Text>
                            </View>
                        )}
                    />
                </Card>
            ))}

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    listCard: {
        marginBottom: 8,
        borderRadius: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginTop: 100,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    errorHint: {
        textAlign: 'center',
        color: '#666',
    }
});
