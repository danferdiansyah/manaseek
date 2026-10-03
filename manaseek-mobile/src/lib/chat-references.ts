export function referenceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const domains = [
      "kemenag.go.id",
      "nu.or.id",
      "mui.or.id",
      "muhammadiyah.or.id",
      "quran.com",
      "sunnah.com",
      "dar-alifta.org",
    ];
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      domains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`))
      ? url.href
      : null;
  } catch {
    return null;
  }
}
