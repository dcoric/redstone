import { View, Text, TouchableOpacity } from 'react-native';
import { FileWithRelations } from '../lib/types';
import { FileText, Folder } from 'lucide-react-native';
import clsx from 'clsx';
import { useRouter } from 'expo-router';

interface FileCardProps {
    file: FileWithRelations;
}

export default function FileCard({ file }: FileCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="bg-white p-4 rounded-lg border border-gray-200 mb-3 flex-row items-center shadow-sm"
            onPress={() => router.push(`/file/${file.id}`)}
        >
            <View className="bg-blue-50 p-3 rounded-full mr-4">
                <FileText size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={1}>
                    {file.title || 'Untitled'}
                </Text>
                <View className="flex-row items-center">
                    <Text className="text-gray-500 text-xs mr-2">
                        {new Date(file.updatedAt).toLocaleDateString()}
                    </Text>
                    {file.folder && (
                        <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded">
                            <Folder size={10} color="#6b7280" className="mr-1" />
                            <Text className="text-gray-500 text-xs">{file.folder.name}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
