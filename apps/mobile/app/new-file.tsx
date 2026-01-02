import { useState } from 'react';
import { View, TextInput, ActivityIndicator, Alert, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { dbFiles } from '../lib/db';
import { Save, X } from 'lucide-react-native';

export default function NewFile() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Title cannot be empty');
            return;
        }

        setSaving(true);
        try {
            // Offline-first: save locally
            const id = Date.now().toString(); // Temporary ID
            await dbFiles.insert({
                id,
                title,
                content,
                folder_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                deleted_at: null,
                last_synced: null,
                dirty: 1,
                versionId: null
            });

            // router.replace(`/file/${id}`); // We'd need to update editor too.
            // For now just go back.
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to create file');
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <Stack.Screen
                options={{
                    title: 'New File',
                    presentation: 'modal',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-blue-600 text-base">Cancel</Text>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleCreate} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#3b82f6" /> : <Text className="text-blue-600 font-bold text-base">Create</Text>}
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView className="flex-1 p-4">
                <TextInput
                    className="text-2xl font-bold text-gray-900 mb-4"
                    placeholder="File Title"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
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
