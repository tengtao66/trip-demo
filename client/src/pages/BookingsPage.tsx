import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { tripImages, STATUS_LABELS } from "@/lib/constants";
import type { Booking } from "@/types/booking";

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/bookings")
      .then((r) => r.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">Loading bookings...</div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground mb-4">No bookings yet</p>
        <Link to="/" className="text-primary underline text-sm">
          Browse trips
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        My Bookings
      </h1>
      <div className="space-y-3">
        {bookings.map((b) => (
          <Link
            key={b.id}
            to={`/bookings/${b.id}`}
            className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
          >
            {/* Trip image */}
            <div
              className="h-14 w-20 rounded-lg shrink-0 bg-cover bg-center relative overflow-hidden"
              style={
                tripImages[b.trip_slug]
                  ? { backgroundImage: `url(${tripImages[b.trip_slug]})` }
                  : { background: b.image_gradient || "#ccc" }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-card/40 to-transparent" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground truncate">
                  {b.trip_name}
                </p>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{b.booking_reference}</span>
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
        ))}
      </div>
    </div>
  );
}
