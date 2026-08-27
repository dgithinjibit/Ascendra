/**
 * Teacher Dashboard Page
 * 
 * Main entry point for teacher real-time monitoring dashboard.
 */

import { TeacherDashboardNew } from '@/components/teacher/teacher-dashboard-new';

export const metadata = {
  title: 'Teacher Dashboard - syncsenta',
  description: 'Monitor your students in real-time and provide timely interventions',
};

export default function TeacherDashboardPage() {
  return (
    <main className="education-shell">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <TeacherDashboardNew />
      </div>
    </main>
  );
}
