// Belden's yard/office is Eastern time; the server (Vercel) runs UTC by
// default, so every date shown to a human needs to be pinned to this zone
// explicitly rather than relying on the server's local time.
const TIME_ZONE = "America/New_York";

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { timeZone: TIME_ZONE });
}
