import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { SWRProvider } from '@/components/providers/swr-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Redstone Vault — Knowledge Management',
  description: 'An Obsidian-like knowledge management application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <SWRProvider>{children}</SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
