import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFiles } from '../../lib/hooks/use-files';
import FileCard from '../../components/file-card';
import { Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function FileList() {
    const { files, loading, refreshing, refresh, reload } = useFiles();
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'My Files (Offline)',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/new-file')}>
                            <Plus color="#3b82f6" size={24} />
                        </TouchableOpacity>
                    )
                }}
            />

            <FlatList
                data={files}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FileCard file={{
                        ...item,
                        userId: '', // mock
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        deletedAt: item.deleted_at,
                        lastSynced: item.last_synced || '',
                        folder: undefined, // TODO: fetch folder name
                        folderId: item.folder_id
                    }} />
                )}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center mt-20">
                        <Text className="text-gray-500 text-lg">No files found</Text>
                        <Text className="text-gray-400 text-sm mt-2">Create a new file to get started</Text>
                    </View>
                }
            />
        </View>
    );
}
