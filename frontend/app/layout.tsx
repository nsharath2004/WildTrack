import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'WildTrack – Wildlife Conservation and Management System',
  description: 'PES University 5th Semester DBMS Mini-Project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 flex min-h-screen">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col pl-64 min-w-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
