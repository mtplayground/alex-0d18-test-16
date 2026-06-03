export function getSiteUrl() {
  return new URL(process.env.AUTH_URL ?? "http://localhost:8080");
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
