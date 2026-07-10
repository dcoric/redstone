import { View, Text, TouchableOpacity } from 'react-native';
import { Clock3, FileText, TriangleAlert } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { LocalFile } from '../lib/db';

interface FileCardProps {
    file: LocalFile;
}

export default function FileCard({ file }: FileCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="mb-3 flex-row items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            onPress={() => router.push(`/file/${file.id}`)}
        >
            <View className="mr-4 rounded-full bg-blue-50 p-3">
                <FileText size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
                <Text
                    className="mb-1 text-base font-semibold text-gray-900"
                    numberOfLines={1}
                >
                    {file.title || 'Untitled'}
                </Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-gray-500">
                        {new Date(file.updated_at).toLocaleDateString()}
                    </Text>
                    {file.conflict_json ? (
                        <View className="flex-row items-center gap-1 rounded bg-amber-100 px-2 py-0.5">
                            <TriangleAlert size={10} color="#b45309" />
                            <Text className="text-xs text-amber-700">Conflict</Text>
                        </View>
                    ) : file.dirty ? (
                        <View className="flex-row items-center gap-1 rounded bg-gray-100 px-2 py-0.5">
                            <Clock3 size={10} color="#6b7280" />
                            <Text className="text-xs text-gray-500">Pending sync</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}
