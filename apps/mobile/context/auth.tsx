import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
    ApiClientError,
    authApi,
    sessionStorage,
    setUnauthorizedHandler,
} from '../lib/api-client';
import type { User } from '../lib/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function useProtectedRoute(user: User | null, isLoaded: boolean) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const isLoginRoute = segments[0] === 'login';
        if (!user && !isLoginRoute) {
            router.replace('/login');
        } else if (user && isLoginRoute) {
            router.replace('/(app)/');
        }
    }, [isLoaded, router, segments, user]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setUnauthorizedHandler(() => setUser(null));
        return () => setUnauthorizedHandler(null);
    }, []);

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            try {
                const session = await sessionStorage.get();
                if (!session || !active) return;

                setUser(session.user);
                try {
                    const response = await authApi.me();
                    if (!active) return;
                    await sessionStorage.set({
                        token: session.token,
                        user: response.user,
                    });
                    setUser(response.user);
                } catch (error) {
                    if (error instanceof ApiClientError && error.status === 401) {
                        if (active) setUser(null);
                    }
                    // Keep the cached session during temporary network failures.
                }
            } finally {
                if (active) setIsLoading(false);
            }
        };

        restoreSession();
        return () => {
            active = false;
        };
    }, []);

    useProtectedRoute(user, !isLoading);

    const signIn = async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        await sessionStorage.set({ token: response.token, user: response.user });
        setUser(response.user);
    };

    const signOut = async () => {
        await sessionStorage.remove();
        setUser(null);
    };

    const signUp = async (email: string, password: string, name?: string) => {
        await authApi.register(email, password, name);
        await signIn(email, password);
    };

    return (
        <AuthContext.Provider
            value={{ signIn, signOut, signUp, user, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
}
