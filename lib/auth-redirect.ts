const destinations = new Set(["/dashboard", "/account", "/bets", "/games", "/reset-password"]);

export function safeAuthRedirect(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://sharpline.invalid");
    return url.origin === "https://sharpline.invalid" && destinations.has(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}