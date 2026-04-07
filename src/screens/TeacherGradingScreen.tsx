import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title } from 'react-native-paper';

export default function TeacherGradingScreen() {
    return (
        <View style={styles.container}>
            <Title>Chấm điểm</Title>
            <Text>Chức năng đang được phát triển...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
