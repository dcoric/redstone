import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { filesApi } from '../../lib/api-client';
import { FileWithRelations } from '../../lib/types';
import FileCard from '../../components/file-card';
import { Plus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function FileList() {
    const [files, setFiles] = useState<FileWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadFiles = async () => {
        try {
            const response = await filesApi.list();
            setFiles(response.files);
        } catch (error) {
            console.error('Failed to load files', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFiles();
    }, []);

    if (loading && !refreshing) {
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
                    title: 'My Files',
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
                renderItem={({ item }) => <FileCard file={item} />}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
