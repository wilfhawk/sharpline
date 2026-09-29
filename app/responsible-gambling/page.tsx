export const metadata = { title: "Responsible Gambling — SharpLine" };

export default function ResponsibleGamblingPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Responsible Gambling
        </h1>
      </div>

      <p>
        SharpLine provides statistical odds analysis, not a guarantee of
        outcomes. A positive expected value (+EV) is a long-run statistical
        edge — individual wagers can still lose, and gambling always carries
        real financial risk. Please gamble only with money you can afford to
        lose, set limits before you play, and never chase losses.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          Signs of a gambling problem
        </h2>
        <ul className="list-disc pl-5">
          <li>Betting more than you can afford to lose</li>
          <li>Chasing losses with bigger bets</li>
          <li>Lying about how much time or money you spend gambling</li>
          <li>Gambling affecting your work, relationships, or finances</li>
          <li>Feeling anxious, irritable, or unable to stop</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">Get help</h2>
        <p>
          If you or someone you know may have a gambling problem, help is
          free and confidential:
        </p>
        <ul className="list-disc pl-5">
          <li>
            National Council on Problem Gambling helpline:{" "}
            <a href="tel:1-800-522-4700" className="underline hover:text-foreground">
              1-800-522-4700
            </a>{" "}
            (24/7, US)
          </li>
          <li>
            <a
              href="https://www.ncpgambling.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              ncpgambling.org
            </a>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          Tools to stay in control
        </h2>
        <p>
          Most U.S. sportsbooks offer deposit limits, time-outs, and
          self-exclusion tools directly in their apps. SharpLine encourages
          you to set those limits before you bet, and to treat any +EV
          opportunity shown here as one data point among many — not
          investment or financial advice.
        </p>
      </section>
    </article>
  );
}
