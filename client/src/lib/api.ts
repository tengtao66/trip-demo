import type { Trip } from "@/types/trip";

export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch("/api/trips");
  return res.json();
}

export async function fetchTrip(slug: string): Promise<Trip> {
  const res = await fetch(`/api/trips/${slug}`);
  if (!res.ok) throw new Error("Trip not found");
  return res.json();
}

// Trip request helpers (used by invoice flow)
export async function submitTripRequest(data: {
  email: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  activities: string[];
  notes: string | null;
}): Promise<{ id: string; totalEstimate: number; depositAmount: number; balanceAmount: number }> {
  const { authFetch } = await import("@/lib/auth-fetch");
  const res = await authFetch("/api/trip-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit trip request");
  }
  return res.json();
}

export async function createInvoice(tripRequestId: string): Promise<{
  bookingId: string;
  bookingReference: string;
  invoiceId: string;
  invoiceUrl: string;
}> {
  const { authFetch } = await import("@/lib/auth-fetch");
  const res = await authFetch("/api/invoices/create", {
    method: "POST",
    body: JSON.stringify({ tripRequestId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create invoice");
  }
  return res.json();
}

export async function sendInvoice(invoiceId: string): Promise<{ status: string }> {
  const { authFetch } = await import("@/lib/auth-fetch");
  const res = await authFetch(`/api/invoices/${invoiceId}/send`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to send invoice");
  }
  return res.json();
}

export async function pollInvoiceStatus(invoiceId: string): Promise<{
  status: string;
  paypalStatus: string;
  paidAmount: number;
  totalAmount: number;
  invoiceUrl: string;
  checkedAt: string;
}> {
  const { authFetch } = await import("@/lib/auth-fetch");
  const res = await authFetch(`/api/invoices/${invoiceId}/status`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to poll invoice status");
  }
  return res.json();
}
