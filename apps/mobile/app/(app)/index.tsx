import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useFiles } from '../../lib/hooks/use-files';
import { flattenFolders } from '../../lib/folders';
import FileCard from '../../components/file-card';

export default function FileList() {
    const {
        files,
        folders,
        tags,
        fileTags,
        loading,
        refreshing,
        refresh,
        reload,
        syncStatus,
        syncErrors,
    } = useFiles();
    const [query, setQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            void reload();
        }, [reload])
    );

    const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
    const folderNames = useMemo(
        () => new Map(folders.map((folder) => [folder.id, folder.name])),
        [folders]
    );
    const tagsByFile = useMemo(() => {
        const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
        const result = new Map<string, string[]>();
        for (const fileTag of fileTags) {
            const name = tagNames.get(fileTag.tag_id);
            if (!name) continue;
            result.set(fileTag.file_id, [
                ...(result.get(fileTag.file_id) ?? []),
                name,
            ]);
        }
        return result;
    }, [fileTags, tags]);
    const filteredFiles = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return files.filter((file) => {
            const matchesFolder = selectedFolderId === null
                || file.folder_id === selectedFolderId;
            const matchesQuery = !normalizedQuery
                || file.title.toLowerCase().includes(normalizedQuery)
                || file.content.toLowerCase().includes(normalizedQuery);
            const matchesTag = selectedTagId === null
                || fileTags.some(
                    (fileTag) => fileTag.file_id === file.id
                        && fileTag.tag_id === selectedTagId
                );
            return matchesFolder && matchesQuery && matchesTag;
        });
    }, [fileTags, files, query, selectedFolderId, selectedTagId]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'My Files',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/new-file')}>
                            <Plus color="#3b82f6" size={24} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {syncStatus === 'offline' || syncStatus === 'partial' ? (
                <View
                    className={`px-4 py-2 ${
                        syncStatus === 'offline' ? 'bg-gray-200' : 'bg-amber-100'
                    }`}
                >
                    <Text
                        className={`text-xs ${
                            syncStatus === 'offline'
                                ? 'text-gray-700'
                                : 'text-amber-800'
                        }`}
                    >
                        {syncStatus === 'offline'
                            ? 'Offline — changes will sync when your connection returns.'
                            : syncErrors[0] ?? 'Some changes need attention.'}
                    </Text>
                </View>
            ) : null}

            <View className="border-b border-gray-200 bg-white px-4 py-3">
                <View className="flex-row items-center rounded-lg bg-gray-100 px-3">
                    <Search size={18} color="#6b7280" />
                    <TextInput
                        className="ml-2 flex-1 py-2.5 text-gray-900"
                        placeholder="Search files"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                    />
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-3"
                    contentContainerStyle={{ gap: 8 }}
                >
                    <TouchableOpacity
                        className={`rounded-full px-3 py-1.5 ${
                            selectedFolderId === null ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                        onPress={() => setSelectedFolderId(null)}
                    >
                        <Text
                            className={
                                selectedFolderId === null
                                    ? 'text-white'
                                    : 'text-gray-700'
                            }
                        >
                            All files
                        </Text>
                    </TouchableOpacity>
                    {folderOptions.map(({ folder, depth }) => (
                        <TouchableOpacity
                            key={folder.id}
                            className={`rounded-full px-3 py-1.5 ${
                                selectedFolderId === folder.id
                                    ? 'bg-blue-600'
                                    : 'bg-gray-100'
                            }`}
                            onPress={() => setSelectedFolderId(folder.id)}
                        >
                            <Text
                                className={
                                    selectedFolderId === folder.id
                                        ? 'text-white'
                                        : 'text-gray-700'
                                }
                            >
                                {'› '.repeat(depth)}{folder.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {tags.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mt-2"
                        contentContainerStyle={{ gap: 8 }}
                    >
                        <TouchableOpacity
                            className={`rounded-full border px-3 py-1 ${
                                selectedTagId === null
                                    ? 'border-violet-600 bg-violet-600'
                                    : 'border-violet-200 bg-white'
                            }`}
                            onPress={() => setSelectedTagId(null)}
                        >
                            <Text
                                className={
                                    selectedTagId === null
                                        ? 'text-white'
                                        : 'text-violet-700'
                                }
                            >
                                All tags
                            </Text>
                        </TouchableOpacity>
                        {tags.map((tag) => (
                            <TouchableOpacity
                                key={tag.id}
                                className={`rounded-full border px-3 py-1 ${
                                    selectedTagId === tag.id
                                        ? 'border-violet-600 bg-violet-600'
                                        : 'border-violet-200 bg-white'
                                }`}
                                onPress={() => setSelectedTagId(tag.id)}
                            >
                                <Text
                                    className={
                                        selectedTagId === tag.id
                                            ? 'text-white'
                                            : 'text-violet-700'
                                    }
                                >
                                    #{tag.name} {tag.file_count ?? 0}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : null}
            </View>

            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FileCard
                        file={item}
                        folderName={
                            item.folder_id
                                ? folderNames.get(item.folder_id)
                                : undefined
                        }
                        tagNames={tagsByFile.get(item.id) ?? []}
                    />
                )}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-lg text-gray-500">No files found</Text>
                        <Text className="mt-2 text-sm text-gray-400">
                            {query || selectedFolderId || selectedTagId
                                ? 'Try another search or folder.'
                                : 'Create a new file to get started.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
