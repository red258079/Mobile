import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title } from 'react-native-paper';

export default function TeacherMonitoringScreen() {
    return (
        <View style={styles.container}>
            <Title>Giám sát thi</Title>
            <Text>Chức năng đang được phát triển...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
