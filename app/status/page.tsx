import { AppHeader } from "@/components/layout/AppHeader";
import { StatusPanel } from "@/components/status/StatusPanel";

export const metadata = { title: "Status — SharpLine" };

export default function StatusPage() {
  return (
    <>
      <AppHeader />
      <StatusPanel />
    </>
  );
}

