export const metadata = { title: "Methodology — SharpLine" };

export default function MethodologyPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Methodology</h1>
        <p className="mt-1 text-xs">How SharpLine computes a fair price and an edge.</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">1. The problem: the vig</h2>
        <p>
          Every sportsbook builds a profit margin (the &quot;vig&quot; or
          &quot;overround&quot;) into its odds. For a two-way market, converting
          both sides&apos; decimal odds to implied probability and adding them
          together gives something above 100% — that excess is the book&apos;s
          margin, not real probability. To find a bet&apos;s true edge, that
          margin has to be removed first.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">2. Sharp reference book</h2>
        <p>
          SharpLine de-vigs against Pinnacle (falling back to Circa or
          BetOnline when Pinnacle hasn&apos;t posted a line for a market) —
          books known for the thinnest margins and sharpest, most efficient
          pricing in the industry. Their de-vigged price is treated as the
          closest available estimate of the &quot;true&quot; probability.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">
          3. Multiplicative (proportional) method
        </h2>
        <p>
          Convert each side&apos;s decimal odds to a raw implied probability
          (1 / odds), then split the combined overround back out
          proportionally:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground">
{`rawA = 1 / oddsA
rawB = 1 / oddsB
overround = rawA + rawB

fairProbabilityA = rawA / overround
fairProbabilityB = rawB / overround`}
        </pre>
        <p>
          Simple and fast, but it assumes the book&apos;s margin is spread
          evenly across both sides in proportion to their raw probability —
          not always true in practice, especially on lopsided lines.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">4. Power method</h2>
        <p>
          A more realistic model for how margin is actually distributed: find
          a single exponent <code className="rounded bg-muted/40 px-1 py-0.5 text-foreground">k ≥ 1</code> such
          that raising both raw probabilities to the power of k makes them sum
          to exactly 100%:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground">
{`rawA = 1 / oddsA
rawB = 1 / oddsB

find k such that: rawA^k + rawB^k = 1

fairProbabilityA = rawA^k
fairProbabilityB = rawB^k`}
        </pre>
        <p>
          SharpLine solves for <code className="rounded bg-muted/40 px-1 py-0.5 text-foreground">k</code> via
          bisection search (100 iterations between k=1 and k=64, since the sum
          is monotonically decreasing in k) rather than a closed-form formula.
          This tends to track real sportsbook margin distribution more
          accurately than the multiplicative method, particularly for
          heavily-favored sides.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">5. Computing EV%</h2>
        <p>
          Once a fair probability is known, a book&apos;s own price is scored
          against it directly:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground">
{`EV% = (fairProbability × bookOddsDecimal − 1) × 100`}
        </pre>
        <p>
          A positive result means the book is offering more than the fair
          price implies — a statistical edge over many bets at that same
          price, though any single bet can still lose. SharpLine ranks every
          book/side combination across every tracked market by this number.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-foreground">6. Limits of this approach</h2>
        <p>
          A de-vigged sharp price is an estimate of fair probability, not a
          guarantee — it can still be wrong, and lines move. SharpLine
          defaults to the multiplicative method; see{" "}
          <a href="/learn" className="underline underline-offset-2">
            /learn
          </a>{" "}
          for Kelly stake sizing, CLV, arbitrage, and middles, which are
          related but distinct concepts from the de-vig math on this page.
        </p>
      </section>
    </article>
  );
}
