import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Trip } from "@/types/trip";

const flowBadge: Record<
  Trip["payment_flow"],
  { label: string; className: string }
> = {
  authorize: {
    label: "Reserve Now",
    className: "bg-primary text-primary-foreground",
  },
  vault: {
    label: "Add-ons",
    className: "bg-accent text-accent-foreground",
  },
  invoice: {
    label: "Invoice",
    className: "bg-secondary text-secondary-foreground",
  },
};

export default function TripCard({ trip }: { trip: Trip }) {
  const badge = flowBadge[trip.payment_flow];

  return (
    <Link to={`/trips/${trip.slug}`} className="block group">
      <Card className="overflow-hidden border-border bg-card transition-shadow hover:shadow-lg">
        {/* Image area */}
        <div
          className="relative h-48 w-full"
          style={{ background: trip.image_gradient }}
        >
          {/* Duration badge — top-right */}
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground">
            <Clock className="h-3.5 w-3.5" />
            {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
          </span>

          {/* Payment flow badge — top-left */}
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Card body */}
        <CardContent className="space-y-2">
          <h3 className="font-semibold text-base text-foreground leading-snug">
            {trip.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trip.description}
          </p>
          <p className="text-lg font-semibold text-accent">
            ${trip.base_price.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
