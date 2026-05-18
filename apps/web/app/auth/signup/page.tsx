'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { RedstoneLogo } from '@/components/brand/redstone-logo';
import { Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.register(email, password, name || undefined);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          'Registration successful, but sign in failed. Please try signing in.'
        );
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,#1e293b_0%,#0b1326_100%)] p-4">
      <main className="relative flex w-full max-w-[390px] flex-col items-center overflow-hidden rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #f1f5f9 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="z-10 flex w-full flex-col items-center gap-4 pt-2">
          <RedstoneLogo size={64} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started with Redstone Vault
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="z-10 mt-8 flex w-full flex-col gap-6"
        >
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5" htmlFor="name">
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                Name (optional)
              </span>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5" htmlFor="email">
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                Email Address
              </span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5" htmlFor="password">
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                Password
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="ml-1 text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-[#ea580c] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>

        <p className="z-10 mt-8 pb-2 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
