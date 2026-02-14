'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, actions } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await actions.checkAuth();
      setChecking(false);
    };
    initAuth();
  }, [actions]);

  useEffect(() => {
    // Redirect authenticated users away from public pages
    if (!checking && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/');
    }
    
    // Redirect unauthenticated users to login
    if (!checking && !isAuthenticated && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [isAuthenticated, checking, router, pathname]);

  if (checking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If not authenticated (and not on public pages), we render nothing while redirecting
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
    return null;
  }

  return <>{children}</>;
}
