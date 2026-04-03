import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Mail, MapPin } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface TripRequest {
  id: string;
  email: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  destinations: string[];
  activities: string[];
  total_estimate: number;
  deposit_amount: number;
  status: string;
  created_at: string;
}

const DESTINATION_LABELS: Record<string, string> = {
  paris: "Paris",
  rome: "Rome",
  santorini: "Santorini",
  barcelona: "Barcelona",
  "swiss-alps": "Swiss Alps",
  amsterdam: "Amsterdam",
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

export default function TripRequestsPage() {
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/trip-requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">
        Loading trip requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">No trip requests yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Customers can submit custom trip requests from the European Tour page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        Trip Requests
      </h1>
      <div className="space-y-3">
        {requests.map((req) => {
          const statusConfig = STATUS_CONFIG[req.status] || {
            label: req.status,
            className: "bg-muted text-muted-foreground",
          };
          return (
            <Link
              key={req.id}
              to={`/merchant/trip-requests/${req.id}`}
              className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
            >
              <div
                className="h-14 w-14 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #DAA520 0%, #8B4513 100%)",
                }}
              >
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    Custom European Tour
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {req.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  <span>${req.total_estimate.toLocaleString()}</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    {req.destinations.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {DESTINATION_LABELS[d] || d}
                      </span>
                    ))}
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
