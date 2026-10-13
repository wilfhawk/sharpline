import { AppHeader } from "@/components/layout/AppHeader";
import { EarningsCalculator } from "@/components/dashboard/EarningsCalculator";

export const metadata = { title: "Earnings & Risk Calculator | SharpLine", description: "Explore hypothetical betting returns, costs and downside risk. Not an income forecast." };

export default function EarningsPage() {
  return <><AppHeader /><EarningsCalculator /></>;
}