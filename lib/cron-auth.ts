export function isCronAuthorized(
  configuredSecret: string | undefined,
  environment: string | undefined,
  authorizationHeader: string | null
): boolean {
  if (!configuredSecret) return environment !== "production";
  return authorizationHeader === `Bearer ${configuredSecret}`;
}