import { AppHeader } from "@/components/layout/AppHeader";
import { GamesView } from "@/components/dashboard/GamesView";

export const metadata = { title: "All Games | SharpLine" };

type Param = string | string[] | undefined;
const first = (value: Param) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ search?: Param; league?: Param }> }) {
  const { search, league } = await searchParams;
  const initialSearch = first(search).slice(0, 80);
  const initialLeague = first(league).slice(0, 40);
  return <><AppHeader /><GamesView key={`${initialLeague}|${initialSearch}`} initialSearch={initialSearch} initialLeague={initialLeague} /></>;
}