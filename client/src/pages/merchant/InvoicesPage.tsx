import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, User, Receipt } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import type { Booking } from "@/types/booking";

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

export default function InvoicesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/bookings")
      .then((r) => r.json())
      .then((all: Booking[]) =>
        setBookings(all.filter((b) => b.payment_flow === "invoice"))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">Loading invoices...</div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">No invoices yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create invoices from the{" "}
          <Link
            to="/merchant/trip-requests"
            className="text-primary hover:underline"
          >
            Trip Requests
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Invoices</h1>
      <div className="space-y-3">
        {bookings.map((b) => {
          const statusConfig = STATUS_CONFIG[b.status] || {
            label: b.status,
            className: "bg-muted text-muted-foreground",
          };
          return (
            <Link
              key={b.id}
              to={`/merchant/invoices/${b.id}`}
              className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
            >
              <div
                className="h-14 w-14 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #DAA520 0%, #8B4513 100%)",
                }}
              >
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {b.trip_name || "Custom European Grand Tour"}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{b.booking_reference}</span>
                  {b.customer_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {b.customer_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(b.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    ${b.paid_amount.toLocaleString()} / $
                    {b.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
