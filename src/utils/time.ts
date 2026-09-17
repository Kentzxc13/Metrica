/**
 * Utility functions for clean time display and dynamic relative time calculation.
 * Backend-ready for Supabase / REST API ISO date strings, SQL timestamps, or local time strings.
 */

export function getRelativeTime(
  timestamp?: string | Date | number,
  fallbackRelative?: string,
): string {
  if (typeof window === "undefined" && fallbackRelative) {
    return fallbackRelative.replace(/\s*UTC/i, "").trim();
  }
  if (!timestamp && !fallbackRelative) return "Just now";

  let date: Date | null = null;

  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number") {
    date = new Date(timestamp);
  } else if (typeof timestamp === "string") {
    // If it's an ISO date string (e.g. '2026-09-15T14:32:05.000Z' or standard Supabase timestamps)
    if (timestamp.includes("T") || (timestamp.includes("-") && timestamp.includes(":"))) {
      const parsed = new Date(timestamp.replace(" ", "T"));
      if (!isNaN(parsed.getTime())) date = parsed;
    } else {
      // Time-only string (e.g. '14:32:05' or '14:32:05 UTC')
      const cleanTime = timestamp.replace(/\s*UTC/i, "").trim();
      const parts = cleanTime.split(":");
      if (parts.length >= 2) {
        const today = new Date();
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parts[2] ? parseInt(parts[2], 10) : 0;
        date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s);
      }
    }
  }

  // If no date could be parsed, fallback to cleaned fallbackRelative string
  if (!date || isNaN(date.getTime())) {
    return fallbackRelative ? fallbackRelative.replace(/\s*UTC/i, "").trim() : "Just now";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Future timestamp or under 1 minute
  if (diffInSeconds < 60) {
    return "Just now";
  }

  // Minutes (up to 59 minutes, e.g. '2m ago', '36m ago')
  if (diffInSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffInSeconds / 60));
    return `${mins}m ago`;
  }

  // Hours (up to 24 hours, e.g. '2h ago', '24h ago')
  if (diffInSeconds <= 86400 + 1800) {
    const hours = Math.round(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Days (e.g. '2d ago', '3d ago', '7d ago')
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) {
    return `${days}d ago`;
  }

  // Months
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Strips any 'UTC' suffix or converts ISO string to clean HH:MM:SS format
 */
export function formatTimeClean(timestamp?: string | Date | number): string {
  if (!timestamp) return "14:32:05";
  if (timestamp instanceof Date) {
    return timestamp.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
  }
  if (typeof timestamp === "number") {
    return new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
  }
  if (typeof timestamp === "string") {
    if (timestamp.includes("T") || (timestamp.includes("-") && timestamp.includes(":"))) {
      const parsed = new Date(timestamp.replace(" ", "T"));
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
      }
    }
    return timestamp.replace(/\s*UTC/i, "").trim();
  }
  return String(timestamp);
}
