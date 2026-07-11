import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Stack,
    useLocalSearchParams,
    useNavigation,
    useRouter,
} from 'expo-router';
import { Save, Trash2 } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import {
    dbFiles,
    dbFolders,
    type FileConflict,
    type LocalFile,
    type LocalFolder,
} from '../../lib/db';
import { flattenFolders } from '../../lib/folders';
import { syncFiles } from '../../lib/sync';

export default function FileEditor() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [file, setFile] = useState<LocalFile | null>(null);
    const [conflict, setConflict] = useState<FileConflict | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [folders, setFolders] = useState<LocalFolder[]>([]);
    const [folderId, setFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const bypassNavigationGuard = useRef(false);
    const router = useRouter();
    const navigation = useNavigation();
    const hasChanges = title !== file?.title
        || content !== file?.content
        || folderId !== file?.folder_id;

    const loadFile = useCallback(async () => {
        if (!id) return;
        const [localFile, localFolders] = await Promise.all([
            dbFiles.getById(id),
            dbFolders.getAll(),
        ]);
        if (!localFile) {
            bypassNavigationGuard.current = true;
            router.replace('/(app)/');
            return;
        }
        setFile(localFile);
        setFolders(localFolders);
        setConflict(await dbFiles.getConflict(id));
        setTitle(localFile.title);
        setContent(localFile.content);
        setFolderId(localFile.folder_id);
        setLoading(false);
    }, [id, router]);

    useEffect(() => {
        void loadFile();
    }, [loadFile]);

    useEffect(() => {
        return navigation.addListener('beforeRemove', (event) => {
            if (!hasChanges || bypassNavigationGuard.current) return;
            event.preventDefault();
            Alert.alert(
                'Discard changes?',
                'This note has changes that have not been saved locally.',
                [
                    { text: 'Keep editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            bypassNavigationGuard.current = true;
                            navigation.dispatch(event.data.action);
                        },
                    },
                ]
            );
        });
    }, [hasChanges, navigation]);

    const handleSave = async () => {
        if (!id || !title.trim()) {
            Alert.alert('Error', 'Title cannot be empty');
            return;
        }

        setSaving(true);
        try {
            await dbFiles.updateLocal(id, {
                title: title.trim(),
                content,
                folder_id: folderId,
            });
            setSyncMessage('Saved locally');
            const result = await syncFiles();
            if (result.status === 'synced') setSyncMessage('Synced');
            if (result.status === 'offline') setSyncMessage('Saved offline');
            if (result.status === 'partial') setSyncMessage('Sync needs attention');
            await loadFile();
        } catch {
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await dbFiles.softDelete(id);
                    bypassNavigationGuard.current = true;
                    router.replace('/(app)/');
                    void syncFiles();
                },
            },
        ]);
    };

    const resolveConflict = async (resolution: 'local' | 'remote') => {
        if (!id) return;
        await dbFiles.resolveConflict(id, resolution);
        setConflict(null);
        if (resolution === 'local') {
            setSyncMessage('Local version queued for sync');
            await syncFiles();
        } else {
            setSyncMessage('Server version restored');
        }
        await loadFile();
    };

    if (loading || !file) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
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
                            <TouchableOpacity
                                onPress={() => setShowPreview((value) => !value)}
                            >
                                <Text className="font-medium text-blue-600">
                                    {showPreview ? 'Edit' : 'Preview'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving || !hasChanges}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                ) : (
                                    <Save color="#3b82f6" size={24} />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete}>
                                <Trash2 color="#ef4444" size={24} />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />

            {conflict ? (
                <View className="border-b border-amber-200 bg-amber-50 p-4">
                    <Text className="font-semibold text-amber-900">
                        This note changed on another device
                    </Text>
                    <Text className="mt-1 text-sm text-amber-800">
                        {conflict.kind === 'remote-delete'
                            ? 'The server copy was deleted.'
                            : `Server version: ${conflict.file.title}`}
                    </Text>
                    <View className="mt-3 flex-row gap-3">
                        <TouchableOpacity
                            className="rounded bg-amber-700 px-3 py-2"
                            onPress={() => void resolveConflict('local')}
                        >
                            <Text className="font-medium text-white">Keep mine</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="rounded border border-amber-700 px-3 py-2"
                            onPress={() => void resolveConflict('remote')}
                        >
                            <Text className="font-medium text-amber-800">
                                Use server version
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <ScrollView className="flex-1 p-4">
                {syncMessage || file.dirty ? (
                    <Text className="mb-3 text-xs text-gray-500">
                        {syncMessage ?? 'Pending sync'}
                    </Text>
                ) : null}
                <Text className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Folder
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                    contentContainerStyle={{ gap: 8 }}
                >
                    <TouchableOpacity
                        className={`rounded-full px-3 py-1.5 ${
                            folderId === null ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                        onPress={() => setFolderId(null)}
                    >
                        <Text className={folderId === null ? 'text-white' : 'text-gray-700'}>
                            No folder
                        </Text>
                    </TouchableOpacity>
                    {flattenFolders(folders).map(({ folder, depth }) => (
                        <TouchableOpacity
                            key={folder.id}
                            className={`rounded-full px-3 py-1.5 ${
                                folderId === folder.id ? 'bg-blue-600' : 'bg-gray-100'
                            }`}
                            onPress={() => setFolderId(folder.id)}
                        >
                            <Text
                                className={
                                    folderId === folder.id
                                        ? 'text-white'
                                        : 'text-gray-700'
                                }
                            >
                                {'› '.repeat(depth)}{folder.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {showPreview ? (
                    <View>
                        <Text className="mb-4 text-2xl font-bold text-gray-900">
                            {title || 'Untitled'}
                        </Text>
                        <Markdown>{content || '_Nothing to preview yet._'}</Markdown>
                    </View>
                ) : (
                    <>
                        <TextInput
                            className="mb-4 text-2xl font-bold text-gray-900"
                            placeholder="Untitled"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            className="min-h-[300px] text-base leading-6 text-gray-700"
                            placeholder="Start typing..."
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
