import SchoolAdminDashboard from "@/components/dashboards/school-admin-dashboard";

/**
 * Canonical Head-of-School entry point.
 * The existing dashboard component is preserved while route aliases are
 * consolidated around /head for public onboarding and future role guards.
 */
export default function HeadDashboardPage() {
  return <SchoolAdminDashboard />;
}
