declare module "jstat" {
  export const jStat: {
    binomial: { cdf(successes: number, trials: number, probability: number): number };
  };
}