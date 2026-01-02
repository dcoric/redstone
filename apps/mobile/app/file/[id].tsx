import { useState, useEffect } from 'react';
import { View, TextInput, ActivityIndicator, Alert, TouchableOpacity, Text, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { filesApi } from '../../lib/api-client';
import { FileWithRelations } from '../../lib/types';
import { Trash2, Save } from 'lucide-react-native';

export default function FileEditor() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [file, setFile] = useState<FileWithRelations | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            loadFile();
        }
    }, [id]);

    const loadFile = async () => {
        try {
            const response = await filesApi.get(id!);
            setFile(response.file);
            setTitle(response.file.title);
            setContent(response.file.content);
        } catch (error) {
            Alert.alert('Error', 'Failed to load file');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Title cannot be empty');
            return;
        }

        setSaving(true);
        try {
            await filesApi.update(id!, {
                title,
                content,
            });
            // Optional: show toast or feedback
        } catch (error) {
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete File',
            'Are you sure you want to delete this file?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await filesApi.delete(id!);
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete file');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <Stack.Screen
                options={{
                    headerTitle: '',
                    headerRight: () => (
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#3b82f6" /> : <Save color="#3b82f6" size={24} />}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete}>
                                <Trash2 color="#ef4444" size={24} />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />

            <ScrollView className="flex-1 p-4">
                <TextInput
                    className="text-2xl font-bold text-gray-900 mb-4"
                    placeholder="Untitled"
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    className="text-base text-gray-700 leading-6 min-h-[300px]"
                    placeholder="Start typing..."
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
