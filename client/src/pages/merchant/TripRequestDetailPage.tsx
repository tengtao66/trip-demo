import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Compass,
  FileText,
  User,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";

interface TripRequest {
  id: string;
  user_id: string;
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
  booking_id: string | null;
  status: string;
  created_at: string;
}

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
  REQUEST_SUBMITTED: {
    label: "New Request",
    className: "bg-blue-100 text-blue-800",
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    className: "bg-purple-100 text-purple-800",
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

export default function TripRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<TripRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/trip-requests/${id}`)
      .then((r) => r.json())
      .then(setRequest)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreateInvoice() {
    if (!request) return;
    setCreating(true);
    setError(null);
    try {
      const res = await authFetch("/api/invoices/create", {
        method: "POST",
        body: JSON.stringify({ tripRequestId: request.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }
      const data = await res.json();
      navigate(`/merchant/invoices/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">Loading request...</div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || {
    label: request.status,
    className: "bg-muted text-muted-foreground",
  };

  const startDate = new Date(request.start_date);
  const endDate = new Date(request.end_date);
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      {/* Back link */}
      <Link
        to="/merchant/trip-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trip Requests
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
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted{" "}
            {new Date(request.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {request.status === "REQUEST_SUBMITTED" && (
          <Button onClick={handleCreateInvoice} disabled={creating}>
            <Receipt className="h-4 w-4 mr-2" />
            {creating ? "Creating..." : "Create Invoice"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Customer & dates */}
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
                  {request.customer_name}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {request.email}
                </p>
              </div>
            </div>
          </div>

          {/* Travel dates */}
          <div className="rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Travel Dates
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-foreground font-medium">
                {startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-muted-foreground">to</span>
              <span className="text-foreground font-medium">
                {endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-muted-foreground">
                ({durationDays} days)
              </span>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Special Requests
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {request.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Pricing breakdown */}
        <div className="space-y-6">
          {/* Destinations */}
          <div className="rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Destinations
            </h3>
            <div className="space-y-2">
              {request.destinations.map((d) => (
                <div
                  key={d}
                  className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-foreground">
                    {DESTINATION_NAMES[d] || d}
                  </span>
                  <span className="font-medium text-foreground">
                    ${(DESTINATION_PRICES[d] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          {request.activities.length > 0 && (
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                Activities
              </h3>
              <div className="space-y-2">
                {request.activities.map((a) => (
                  <div
                    key={a}
                    className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground">
                      {ACTIVITY_NAMES[a] || a}
                    </span>
                    <span className="font-medium text-foreground">
                      ${(ACTIVITY_PRICES[a] || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing summary */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Pricing Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-medium text-foreground">
                  ${request.total_estimate.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">
                  Deposit (40%)
                </span>
                <span className="text-foreground font-semibold">
                  ${request.deposit_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance (60%)</span>
                <span className="text-muted-foreground">
                  ${request.balance_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
