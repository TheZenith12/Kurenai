import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue, Bangers } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { QueryProvider } from '../components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bangers',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kurenai 紅 | Anime Community',
  description: 'Монголын хамгийн том anime community + тоглоомын платформ',
  keywords: ['kurenai', 'anime', 'community', 'mongolia'],
  openGraph: {
    title: 'Kurenai 紅 | Anime Community',
    description: 'Монголын anime community platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d0a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className="dark">
      <body className={`${inter.variable} ${bebasNeue.variable} ${bangers.variable} font-sans bg-background text-foreground antialiased`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(222, 40%, 12%)',
                color: 'hsl(0, 0%, 95%)',
                border: '1px solid hsl(222, 30%, 20%)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: 'hsl(140, 80%, 50%)', secondary: 'white' } },
              error: { iconTheme: { primary: 'hsl(0, 90%, 60%)', secondary: 'white' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
