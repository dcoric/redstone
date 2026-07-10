import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { dbFiles } from '../lib/db';
import { syncFiles } from '../lib/sync';

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
            const now = new Date().toISOString();
            await dbFiles.insert({
                id: Crypto.randomUUID(),
                title: title.trim(),
                content,
                folder_id: null,
                created_at: now,
                updated_at: now,
                deleted_at: null,
                last_synced: null,
                dirty: 1,
                version_id: null,
                conflict_json: null,
            });
            router.back();
            void syncFiles();
        } catch {
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
                            <Text className="text-base text-blue-600">Cancel</Text>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleCreate} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                            ) : (
                                <Text className="text-base font-bold text-blue-600">
                                    Create
                                </Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView className="flex-1 p-4">
                <TextInput
                    className="mb-4 text-2xl font-bold text-gray-900"
                    placeholder="File Title"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                />
                <TextInput
                    className="min-h-[300px] text-base leading-6 text-gray-700"
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
