import { AppHeader } from "@/components/layout/AppHeader";
import { OnboardingFlow } from "@/components/dashboard/OnboardingFlow";

export const metadata = { title: "Build your dashboard | SharpLine" };

export default function OnboardingPage() {
  return <><AppHeader /><OnboardingFlow /></>;
}
