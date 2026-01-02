import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/auth';
import { Stack, useRouter } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (isRegistering) {
                await signUp(email, password);
            } else {
                await signIn(email, password);
            }
            // Router redirection is handled by the AuthProvider
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-8 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="mb-10">
                <Text className="text-3xl font-bold text-gray-900 text-center mb-2">Redstone</Text>
                <Text className="text-gray-500 text-center">
                    {isRegistering ? 'Create an account' : 'Welcome back'}
                </Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                    <TextInput
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                    <TextInput
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="w-full bg-blue-600 rounded-lg py-3 mt-4"
                    onPress={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold">
                            {isRegistering ? 'Sign Up' : 'Sign In'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-4"
                    onPress={() => setIsRegistering(!isRegistering)}
                >
                    <Text className="text-blue-600 text-center">
                        {isRegistering
                            ? 'Already have an account? Sign In'
                            : "Don't have an account? Sign Up"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
