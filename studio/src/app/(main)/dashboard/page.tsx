"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ParentDashboard from '@/components/dashboards/parent-dashboard';
import SchoolAdminDashboard from '@/components/dashboards/school-admin-dashboard';
import NationalAdminDashboard from '@/components/dashboards/national-admin-dashboard';
import type { UserRole } from '@/lib/types';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const DashboardSkeleton = () => (
  <div className="space-y-5 p-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
    </div>
  </div>
);

function RoleRedirectCard({ role }: { role: string }) {
  const router = useRouter();
  const destinations: Record<string, { label: string; path: string }> = {
    teacher:        { label: 'Teacher Dashboard', path: '/teacher/dashboard' },
    school_head:    { label: 'School Dashboard',  path: '/teacher/dashboard' },
    county_officer: { label: 'County Dashboard',  path: '/teacher/dashboard' },
  };
  const dest = destinations[role];

  // Auto-navigate immediately — no extra button click needed.
  useEffect(() => {
    if (dest) router.replace(dest.path);
  }, [dest, router]);

  if (!dest) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
          <LayoutDashboard className="h-6 w-6 text-teal-600" />
        </div>
        <h2 className="text-lg font-bold">{dest.label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Taking you there…</p>
        <Button className="mt-6 w-full gap-2" onClick={() => router.replace(dest.path)}>
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Resolve the signed-in user's role.
 *
 * Priority:
 *  1. Supabase session → profiles table  (covers demo-login + real auth)
 *  2. Legacy userRole cookie             (presentation / no-Supabase mode)
 */
async function resolveRole(): Promise<UserRole | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profile?.role) return profile.role as UserRole;
    }
  } catch {
    // Supabase not configured — fall through.
  }

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)userRole=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]) as UserRole;
  }

  return null;
}

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolveRole().then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  switch (role) {
    case 'teacher':
    case 'school_head':
    case 'county_officer':
      return <RoleRedirectCard role={role} />;
    case 'parent':
      return <Suspense fallback={<DashboardSkeleton />}><ParentDashboard /></Suspense>;
    case 'school_admin':
      return <Suspense fallback={<DashboardSkeleton />}><SchoolAdminDashboard /></Suspense>;
    case 'national_admin':
      return <Suspense fallback={<DashboardSkeleton />}><NationalAdminDashboard /></Suspense>;
    default:
      return <DashboardSkeleton />;
  }
}
