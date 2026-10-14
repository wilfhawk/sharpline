import { AppHeader } from "@/components/layout/AppHeader";
import { GamesView } from "@/components/dashboard/GamesView";

export const metadata = { title: "All Games | SharpLine" };

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ search?: string | string[] }> }) {
  const { search } = await searchParams;
  const initialSearch = (Array.isArray(search) ? search[0] : search) ?? "";
  return <><AppHeader /><GamesView initialSearch={initialSearch.slice(0, 80)} /></>;
}