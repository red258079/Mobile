import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TeacherHomeScreen from '../screens/TeacherHomeScreen';
import TeacherExamsScreen from '../screens/TeacherExamsScreen';
import TeacherClassesScreen from '../screens/TeacherClassesScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string;

                    if (route.name === 'TeacherHome') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'TeacherClasses') {
                        iconName = focused ? 'book-multiple' : 'book-multiple-outline';
                    } else if (route.name === 'TeacherExams') {
                        iconName = focused ? 'file-document-edit' : 'file-document-edit-outline';
                    } else {
                        iconName = 'help-circle-outline';
                    }

                    return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: '#757575',
                headerShown: false,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    elevation: 8,
                    borderTopWidth: 0,
                    backgroundColor: 'white',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                tabBarItemStyle: {
                    borderRadius: 10,
                    marginHorizontal: 10,
                },
                tabBarActiveBackgroundColor: '#EDE7F6', // Light purple background for active tab
            })}
        >
            <Tab.Screen
                name="TeacherHome"
                component={TeacherHomeScreen}
                options={{ title: 'Trang chủ' }}
            />
            <Tab.Screen
                name="TeacherClasses"
                component={TeacherClassesScreen}
                options={{ title: 'Lớp học' }}
            />
            <Tab.Screen
                name="TeacherExams"
                component={TeacherExamsScreen}
                options={{ title: 'Đề thi' }}
            />
        </Tab.Navigator>
    );
}
