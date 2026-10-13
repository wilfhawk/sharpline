import { AppHeader } from "@/components/layout/AppHeader";
import { GamesView } from "@/components/dashboard/GamesView";

export const metadata = { title: "All Games | SharpLine" };

export default function GamesPage() {
  return <><AppHeader /><GamesView /></>;
}