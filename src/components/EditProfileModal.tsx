import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, useTheme, Avatar, RadioButton } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import authService from '../api/authService';

interface EditProfileModalProps {
    visible: boolean;
    onDismiss: () => void;
    currentUser: any;
    onSuccess: () => void;
}

export default function EditProfileModal({ visible, onDismiss, currentUser, onSuccess }: EditProfileModalProps) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('male');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            setFullName(currentUser.full_name || '');
            setPhone(currentUser.phone || '');
            setDob(currentUser.dob || '');
            setGender(currentUser.gender || 'male');
        }
    }, [currentUser]);

    const handlePickImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.8,
            });

            if (result.assets && result.assets[0].uri) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
            return;
        }

        if (phone && !/^0[1-9][0-9]{8,9}$/.test(phone)) {
            Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
            return;
        }

        setLoading(true);
        try {
            // Update profile info
            await authService.updateProfile({
                fullName: fullName.trim(),
                phone: phone || undefined,
                dob: dob || undefined,
                gender
            });

            // Upload avatar if changed
            if (avatarUri) {
                await authService.uploadAvatar(avatarUri);
            }

            Alert.alert('Thành công', 'Cập nhật thông tin thành công');
            onSuccess();
            onDismiss();
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                <ScrollView>
                    <Text style={styles.title}>Chỉnh sửa thông tin</Text>

                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Avatar.Text
                                size={100}
                                label={fullName ? fullName.substring(0, 2).toUpperCase() : 'HS'}
                                style={{ backgroundColor: theme.colors.primary }}
                            />
                        )}
                        <Button
                            mode="outlined"
                            icon="camera"
                            onPress={handlePickImage}
                            style={styles.changeAvatarBtn}
                        >
                            Đổi ảnh đại diện
                        </Button>
                    </View>

                    {/* Form Fields */}
                    <TextInput
                        label="Họ và tên *"
                        value={fullName}
                        onChangeText={setFullName}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Số điện thoại"
                        value={phone}
                        onChangeText={setPhone}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        placeholder="0xxxxxxxxx"
                    />

                    <TextInput
                        label="Ngày sinh"
                        value={dob}
                        onChangeText={setDob}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                    />

                    {/* Gender Radio */}
                    <Text style={styles.label}>Giới tính</Text>
                    <RadioButton.Group onValueChange={setGender} value={gender}>
                        <View style={styles.radioRow}>
                            <View style={styles.radioItem}>
                                <RadioButton value="male" />
                                <Text>Nam</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="female" />
                                <Text>Nữ</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="other" />
                                <Text>Khác</Text>
                            </View>
                        </View>
                    </RadioButton.Group>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={loading}
                            disabled={loading}
                            style={styles.saveBtn}
                        >
                            Lưu thay đổi
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={onDismiss}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                    </View>
                </ScrollView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    changeAvatarBtn: {
        marginTop: 10,
    },
    input: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
        marginBottom: 8,
    },
    radioRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actions: {
        marginTop: 20,
        gap: 10,
    },
    saveBtn: {
        marginBottom: 8,
    },
});
