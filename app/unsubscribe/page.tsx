import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;
  return <><AppHeader /><main className="mx-auto max-w-xl px-4 py-12"><h1 className="text-2xl font-semibold">Email preferences</h1>{done ? <p className="mt-4">You have unsubscribed from SharpLine email alerts.</p> : token ? <form className="mt-6" method="post" action={`/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`}><Button type="submit">Unsubscribe from email alerts</Button></form> : <p className="mt-4">Open the unsubscribe link from an alert email, or manage alerts in your account.</p>}</main></>;
}