'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export const dynamic = 'force-dynamic';

/**
 * Dashboard router: Redirects to role-specific dashboard
 */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Route to role-specific dashboard
    router.push(`/dashboard/${user.role}`);
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Spinner className="mx-auto mb-4 h-8 w-8" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}
