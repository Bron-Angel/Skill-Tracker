import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Skill Tracker',
  description: 'App for setting goals and tracking progress for learning new skills for kids.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-gray-100 py-4">
              <div className="container mx-auto px-4 text-center text-gray-600">
                &copy; {new Date().getFullYear()} Skill Tracker
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 