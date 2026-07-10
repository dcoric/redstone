import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFiles } from '../../lib/hooks/use-files';
import FileCard from '../../components/file-card';
import { Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function FileList() {
    const {
        files,
        loading,
        refreshing,
        refresh,
        reload,
        syncStatus,
        syncErrors,
    } = useFiles();
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
                    title: 'My Files',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/new-file')}>
                            <Plus color="#3b82f6" size={24} />
                        </TouchableOpacity>
                    )
                }}
            />

            {syncStatus === 'offline' || syncStatus === 'partial' ? (
                <View className={`px-4 py-2 ${syncStatus === 'offline' ? 'bg-gray-200' : 'bg-amber-100'}`}>
                    <Text className={`text-xs ${syncStatus === 'offline' ? 'text-gray-700' : 'text-amber-800'}`}>
                        {syncStatus === 'offline'
                            ? 'Offline — changes will sync when your connection returns.'
                            : syncErrors[0] ?? 'Some changes need attention.'}
                    </Text>
                </View>
            ) : null}

            <FlatList
                data={files}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <FileCard file={item} />}
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
