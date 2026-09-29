import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";

// Auth/subscription gating is wired up in Phase 4/5; renders on mock data until then.
export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <Dashboard />
    </>
  );
}
