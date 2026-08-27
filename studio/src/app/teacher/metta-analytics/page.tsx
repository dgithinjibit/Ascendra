/**
 * MeTTa Analytics Dashboard Page (Phase 2)
 * 
 * Advanced adaptive learning analytics with misconception detection,
 * behavioral profiling, and competency trends.
 */

import { Phase2TeacherDashboard } from '@/components/teacher/phase2-teacher-dashboard';

export const metadata = {
  title: 'MeTTa Analytics - syncsenta',
  description: 'Advanced behavioral analytics and misconception detection dashboard',
};

export default function MeTTaAnalyticsDashboardPage() {
  return (
    <main className="education-shell">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Phase2TeacherDashboard />
      </div>
    </main>
  );
}
