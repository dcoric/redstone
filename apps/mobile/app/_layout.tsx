import { Stack, Slot } from 'expo-router';
import { AuthProvider } from '../context/auth';
import '../global.css';

export default function Layout() {
    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
}
