export function formatPKR(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `Rs. ${Math.round(v).toLocaleString("en-PK")}`;
}

/** Normalizes Pakistani mobile numbers to 03XXXXXXXXX, or null if invalid. Mirrors the database rule. */
export function normalizePkPhone(input: string): string | null {
  const d = input.replace(/[\s\-()]/g, "");
  if (/^\+923\d{9}$/.test(d)) return "0" + d.slice(3);
  if (/^923\d{9}$/.test(d)) return "0" + d.slice(2);
  if (/^03\d{9}$/.test(d)) return d;
  return null;
}

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_TYPE_LABELS: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
  walk_in: "Walk-in",
  takeaway: "Takeaway",
};

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong. Please try again.";
}
