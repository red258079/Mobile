import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title, Button, Appbar } from 'react-native-paper';

export default function ExamScreen({ route, navigation }: any) {
    const { examId, examName } = route.params || { examId: 'unknown', examName: 'Exam' };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={examName} />
            </Appbar.Header>

            <View style={styles.content}>
                <Title style={styles.title}>Exam Engine Ready</Title>
                <Text style={styles.text}>The native exam interface for ID {examId} is being initialized.</Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.goBack()}
                    style={styles.button}
                >
                    Exit Exam
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: 10,
    },
    text: {
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    button: {
        width: '100%',
    }
});
