import { NextResponse } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeMiddleOpportunities } from "@/lib/middles";

export async function GET() {
  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const opportunities = computeMiddleOpportunities(data);

  return NextResponse.json({
    opportunities,
    meta: {
      isMock: provider.isMock,
      providerName: provider.name,
      generatedAt: new Date().toISOString(),
    },
  });
}
