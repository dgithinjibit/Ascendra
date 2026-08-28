"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ParentDashboard from '@/components/dashboards/parent-dashboard';
import SchoolAdminDashboard from '@/components/dashboards/school-admin-dashboard';
import NationalAdminDashboard from '@/components/dashboards/national-admin-dashboard';
import { getServerUser } from '@/lib/auth';
import type { UserRole } from '@/lib/types';
import { BookOpen, LayoutDashboard, ArrowRight } from 'lucide-react';

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
  const destinations: Record<string, { label: string; path: string; description: string }> = {
    teacher: { label: 'Teacher Dashboard', path: '/teacher/dashboard', description: 'Monitor students, manage lessons and view class analytics.' },
    school_head: { label: 'School Dashboard', path: '/teacher/dashboard', description: 'Oversee school performance and staff activity.' },
    county_officer: { label: 'County Dashboard', path: '/teacher/dashboard', description: 'View county-wide education metrics and reports.' },
  };
  const dest = destinations[role];
  if (!dest) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
          <LayoutDashboard className="h-6 w-6 text-teal-600" />
        </div>
        <h2 className="text-lg font-bold">{dest.label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{dest.description}</p>
        <Button className="mt-6 w-full gap-2" onClick={() => router.push(dest.path)}>
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServerUser().then((user) => {
      setRole(user?.role as UserRole);
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
