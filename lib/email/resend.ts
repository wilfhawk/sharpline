/** Minimal Resend (https://resend.com) email client via plain fetch — no SDK dependency. */

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
  unsubscribeUrl?: string;
}

/** Sends one email via Resend's HTTP API. No-ops (returns false) when RESEND_API_KEY isn't set. */
export async function sendEmail({ to, subject, html, idempotencyKey, unsubscribeUrl }: SendEmailParams): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "SharpLine <alerts@sharpline.app>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to, subject, html, ...(unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}) }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend send failed: ${response.status} ${body}`);
  }
  return true;
}
