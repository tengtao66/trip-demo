import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  Receipt,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
import type { BookingDetail } from "@/types/booking";

const DESTINATION_NAMES: Record<string, string> = {
  paris: "Paris, France",
  rome: "Rome, Italy",
  santorini: "Santorini, Greece",
  barcelona: "Barcelona, Spain",
  "swiss-alps": "Swiss Alps",
  amsterdam: "Amsterdam, Netherlands",
};

const DESTINATION_PRICES: Record<string, number> = {
  paris: 1200,
  rome: 1000,
  santorini: 1500,
  barcelona: 900,
  "swiss-alps": 1800,
  amsterdam: 800,
};

const ACTIVITY_NAMES: Record<string, string> = {
  museum: "Guided Museum Tour",
  wine: "Wine Tasting",
  cooking: "Cooking Class",
  boat: "Boat Excursion",
};

const ACTIVITY_PRICES: Record<string, number> = {
  museum: 150,
  wine: 100,
  cooking: 120,
  boat: 200,
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  INVOICE_CREATED: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  AWAITING_DEPOSIT: {
    label: "Awaiting Deposit",
    className: "bg-amber-100 text-amber-800",
  },
  DEPOSIT_RECEIVED: {
    label: "Deposit Received",
    className: "bg-green-100 text-green-800",
  },
  FULLY_PAID: {
    label: "Fully Paid",
    className: "bg-green-100 text-green-800",
  },
};

interface TripRequest {
  id: string;
  email: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  destinations: string[];
  activities: string[];
  notes: string | null;
  total_estimate: number;
  deposit_amount: number;
  balance_amount: number;
  status: string;
  created_at: string;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("Booking not found");
      const data = await res.json();
      setBooking(data);

      // Load associated trip request
      const trRes = await authFetch("/api/trip-requests");
      if (trRes.ok) {
        const requests: TripRequest[] = await trRes.json();
        const match = requests.find((r) => r.booking_id === data.id);
        if (match) setTripRequest(match);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleSendInvoice() {
    if (!booking?.invoice_id) return;
    setSending(true);
    setError(null);
    try {
      const res = await authFetch(`/api/invoices/${booking.invoice_id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invoice");
      }
      await loadBooking();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleRefreshStatus() {
    if (!booking?.invoice_id) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await authFetch(
        `/api/invoices/${booking.invoice_id}/status`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh status");
      }
      const data = await res.json();
      setLastChecked(data.checkedAt);
      await loadBooking();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  function handleCopy() {
    if (!booking?.invoice_url) return;
    navigator.clipboard.writeText(booking.invoice_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">Loading invoice...</div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || {
    label: booking.status,
    className: "bg-muted text-muted-foreground",
  };

  const depositAmount = tripRequest?.deposit_amount ?? booking.total_amount * 0.4;
  const balanceAmount = tripRequest?.balance_amount ?? booking.total_amount * 0.6;
  const paidPercent =
    booking.total_amount > 0
      ? Math.round((booking.paid_amount / booking.total_amount) * 100)
      : 0;

  // Timeline steps
  const timelineSteps = [
    {
      label: "Request Submitted",
      date: tripRequest?.created_at,
      done: true,
    },
    {
      label: "Invoice Created & Sent",
      date: booking.created_at,
      done: ["AWAITING_DEPOSIT", "DEPOSIT_RECEIVED", "FULLY_PAID"].includes(
        booking.status
      ),
    },
    {
      label: `Deposit Received — $${depositAmount.toLocaleString()}`,
      date:
        booking.status === "DEPOSIT_RECEIVED" || booking.status === "FULLY_PAID"
          ? booking.updated_at
          : null,
      done: ["DEPOSIT_RECEIVED", "FULLY_PAID"].includes(booking.status),
    },
    {
      label:
        booking.status === "FULLY_PAID"
          ? `Fully Paid — $${booking.total_amount.toLocaleString()}`
          : `Awaiting Balance — $${balanceAmount.toLocaleString()}`,
      date: booking.status === "FULLY_PAID" ? booking.updated_at : null,
      done: booking.status === "FULLY_PAID",
      pending: booking.status !== "FULLY_PAID",
    },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        to="/merchant/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">
              Custom European Grand Tour
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              INVOICE
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.booking_reference}
            {booking.invoice_id && ` \u2022 PayPal ID: ${booking.invoice_id}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={refreshing || !booking.invoice_id}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Status
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Customer card */}
          <div className="rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Customer
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {booking.customer_name}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {booking.customer_email}
                </p>
              </div>
            </div>
            {tripRequest && (
              <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(tripRequest.start_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}{" "}
                  -{" "}
                  {new Date(tripRequest.end_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Invoice Payment Link card */}
          {booking.invoice_url && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-blue-800 tracking-wider uppercase">
                  Invoice Payment Link
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                  SHAREABLE
                </span>
              </div>
              <p className="text-sm text-foreground">
                This is the link sent to the customer. Click to preview the
                invoice as the customer sees it.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white p-3">
                <p className="flex-1 text-sm font-mono text-blue-700 truncate">
                  {booking.invoice_url}
                </p>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => window.open(booking.invoice_url!, "_blank")}
                >
                  Open
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className={`shrink-0 transition-colors ${
                    copied
                      ? "bg-green-600 hover:bg-green-600 text-white"
                      : ""
                  }`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Open this link in a browser to show the audience the PayPal
                invoice view
              </p>
            </div>
          )}

          {/* Payment progress */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Payment Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    ${depositAmount.toLocaleString()}
                  </span>
                  {booking.paid_amount >= depositAmount ? (
                    <span className="text-xs text-green-600 font-medium">
                      PAID
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    ${balanceAmount.toLocaleString()}
                  </span>
                  {booking.paid_amount >= booking.total_amount ? (
                    <span className="text-xs text-green-600 font-medium">
                      PAID
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-semibold text-foreground">
                  ${booking.total_amount.toLocaleString()}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <p className="text-xs text-green-600">
                {paidPercent}% paid
                {booking.status === "DEPOSIT_RECEIVED" &&
                  " \u2014 deposit received"}
                {booking.status === "FULLY_PAID" && " \u2014 fully paid"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {booking.status === "INVOICE_CREATED" && booking.invoice_id && (
              <Button onClick={handleSendInvoice} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Invoice"}
              </Button>
            )}
          </div>

          {lastChecked && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last checked:{" "}
              {new Date(lastChecked).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Invoice line items */}
          {tripRequest && (
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                Invoice Line Items
              </h3>

              {/* Destinations */}
              <div>
                <p className="text-[10px] font-semibold text-primary tracking-wider uppercase mb-2">
                  Destinations
                </p>
                <div className="space-y-0">
                  {tripRequest.destinations.map((d) => (
                    <div
                      key={d}
                      className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"
                    >
                      <span className="text-foreground">
                        {DESTINATION_NAMES[d] || d}
                      </span>
                      <span className="font-medium">
                        ${(DESTINATION_PRICES[d] || 0).toLocaleString()}.00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              {tripRequest.activities.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-primary tracking-wider uppercase mb-2">
                    Activities
                  </p>
                  <div className="space-y-0">
                    {tripRequest.activities.map((a) => (
                      <div
                        key={a}
                        className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-foreground">
                          {ACTIVITY_NAMES[a] || a}
                        </span>
                        <span className="font-medium">
                          ${(ACTIVITY_PRICES[a] || 0).toLocaleString()}.00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {tripRequest.notes && (
                <div>
                  <p className="text-[10px] font-semibold text-primary tracking-wider uppercase mb-2">
                    Custom Notes
                  </p>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg leading-relaxed">
                    &ldquo;{tripRequest.notes}&rdquo;
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t-2 border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({tripRequest.destinations.length} destination
                    {tripRequest.destinations.length !== 1 ? "s" : ""} +
                    activities)
                  </span>
                  <span>${tripRequest.total_estimate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span>Invoice Total</span>
                  <span>${tripRequest.total_estimate.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice timeline */}
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-4">
              Invoice Timeline
            </h3>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

              {timelineSteps.map((step, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                      step.done
                        ? "bg-green-500 border-green-500"
                        : step.pending
                          ? "bg-amber-500 border-amber-500"
                          : "bg-muted border-border"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      step.pending
                        ? "text-amber-600"
                        : step.done
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(step.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      &mdash;{" "}
                      {new Date(step.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
