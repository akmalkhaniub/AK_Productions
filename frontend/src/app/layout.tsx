import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Fraunces, Noto_Nastaliq_Urdu, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-nastaliq', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: 'AK Productions | Studio OS',
  description: 'The AI-Native Film Production Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${grotesk.variable} ${fraunces.variable} ${nastaliq.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="director"
          enableSystem={false}
          themes={['director', 'neon', 'nastaliq']}
          disableTransitionOnChange
        >
          <div className="grain relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
