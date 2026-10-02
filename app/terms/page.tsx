export const metadata = { title: "Terms of Service — SharpLine" };

export default function TermsPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Terms of Service</h1>
        <p className="mt-1 text-xs">Last updated: September 29, 2026</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">1. What SharpLine is</h2>
        <p>
          SharpLine is a data and analysis tool. It compares publicly
          available sportsbook odds against a de-vigged Pinnacle benchmark to
          highlight statistical pricing discrepancies (&quot;+EV opportunities&quot;).
          SharpLine does not accept wagers, does not hold or transmit funds
          related to gambling, and does not facilitate wagering of any kind.
          It is solely an informational and analytical service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          2. No guarantee of profit
        </h2>
        <p>
          &quot;Expected value&quot; (EV) is a statistical estimate derived from odds
          data at a point in time. A positive EV% reflects a theoretical,
          long-run statistical edge under stated assumptions — it is not a
          prediction, a guarantee, or a certainty of any individual outcome.
          Sports outcomes are inherently uncertain. You may lose money on any
          or all wagers regardless of the EV% shown. Past EV calculations do
          not guarantee future results.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          3. Your responsibility for legal compliance
        </h2>
        <p>
          Sports wagering is regulated at the state, provincial, and national
          level and its legality varies by jurisdiction. You are solely
          responsible for determining whether it is legal for you to view
          sports betting odds information and to place wagers with any
          third-party sportsbook in your jurisdiction. SharpLine makes no
          representation that use of this service is lawful in every
          jurisdiction and takes no responsibility for your compliance with
          local law.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          4. Data and analysis only
        </h2>
        <p>
          SharpLine aggregates and analyzes odds data from third-party
          sportsbooks and data providers. We do not control, and are not
          responsible for, the accuracy, availability, or timeliness of
          third-party odds data, nor for the terms, availability, or conduct
          of any third-party sportsbook. Any wager you place is placed
          directly with the third-party sportsbook, under that sportsbook&apos;s
          own terms, not with SharpLine.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">5. Eligibility</h2>
        <p>
          You must be at least the minimum age required in your jurisdiction
          (21+ by default on this platform) and legally permitted to access
          sports betting information where you reside to use SharpLine.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          6. Subscriptions & billing
        </h2>
        <p>
          Paid plans are billed on a recurring basis through our payment
          processor until cancelled. You can manage or cancel your
          subscription at any time from the Account page.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          7. Disclaimer of warranties; limitation of liability
        </h2>
        <p>
          SharpLine is provided &quot;as is&quot; without warranties of any kind. To
          the maximum extent permitted by law, SharpLine and its operators
          are not liable for any losses, including gambling losses, arising
          from your use of this service or reliance on any data or analysis
          it provides.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">8. Contact</h2>
        <p>Questions about these Terms can be sent to support@sharpline.app.</p>
      </section>
    </article>
  );
}
