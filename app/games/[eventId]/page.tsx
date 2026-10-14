import { AppHeader } from "@/components/layout/AppHeader";
import { GameDetail } from "@/components/dashboard/GameDetail";

export const metadata = { title: "Game predictions | SharpLine" };

export default async function GamePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <><AppHeader /><GameDetail eventId={eventId} /></>;
}
