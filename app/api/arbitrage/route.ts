import { NextResponse } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeArbitrageOpportunities } from "@/lib/arbitrage";

export async function GET() {
  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const opportunities = computeArbitrageOpportunities(data);

  return NextResponse.json({
    opportunities,
    meta: {
      isMock: provider.isMock,
      providerName: provider.name,
      generatedAt: new Date().toISOString(),
    },
  });
}
