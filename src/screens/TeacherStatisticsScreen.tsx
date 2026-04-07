import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title } from 'react-native-paper';

export default function TeacherStatisticsScreen() {
    return (
        <View style={styles.container}>
            <Title>Thống kê & Báo cáo</Title>
            <Text>Chức năng đang được phát triển...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
