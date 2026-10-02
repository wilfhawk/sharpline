export const metadata = { title: "Privacy Policy — SharpLine" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="mt-1 text-xs">Last updated: September 29, 2026</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          1. Information we collect
        </h2>
        <p>
          Account information (email address, authentication identifiers),
          subscription and billing information (processed by our payment
          processor — we do not store full card numbers), age/jurisdiction
          consent confirmations and their timestamps, and product usage data
          (pages visited, features used) to operate and improve the service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          2. How we use information
        </h2>
        <p>
          To provide and secure your account, process payments, communicate
          service updates, comply with legal obligations (including
          age/jurisdiction verification), and improve SharpLine&apos;s product.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          3. Sharing of information
        </h2>
        <p>
          We share data with service providers strictly to operate SharpLine:
          our authentication/database provider, our payment processor, and
          infrastructure/hosting providers. We do not sell your personal
          information. We may disclose information if required by law.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">4. Data retention</h2>
        <p>
          We retain account information for as long as your account is active
          and as needed to comply with legal obligations, resolve disputes,
          and enforce our agreements.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">5. Your choices</h2>
        <p>
          You can access, update, or request deletion of your account
          information at any time by contacting privacy@sharpline.app or from
          the Account page.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">6. Contact</h2>
        <p>Questions about this policy can be sent to privacy@sharpline.app.</p>
      </section>
    </article>
  );
}
