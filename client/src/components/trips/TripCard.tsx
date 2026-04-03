import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { tripImages } from "@/lib/constants";
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
  instant: {
    label: "Pay Later Available",
    className: "bg-blue-600 text-white",
  },
};

export default function TripCard({ trip }: { trip: Trip }) {
  const badge = flowBadge[trip.payment_flow];
  const imageUrl = tripImages[trip.slug];

  return (
    <Link to={`/trips/${trip.slug}`} className="block group h-full">
      <Card className="overflow-hidden border-border bg-card transition-shadow hover:shadow-lg h-full flex flex-col">
        {/* Image area */}
        <div
          className="relative h-48 w-full bg-cover bg-center"
          style={imageUrl
            ? { backgroundImage: `url(${imageUrl})` }
            : { background: trip.image_gradient }
          }
        >
          {/* Bottom gradient fade to card background */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
          {/* Duration badge — top-right (hidden for car rentals with 0 days) */}
          {trip.duration_days > 0 && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" />
              {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
            </span>
          )}

          {/* Payment flow badge — top-left */}
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Card body */}
        <CardContent className="space-y-2 flex-1 flex flex-col">
          <h3 className="font-semibold text-base text-foreground leading-snug">
            {trip.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {trip.description}
          </p>
          <div className="mt-auto">
            {trip.category === "car_rental" && trip.daily_rate ? (
              <p className="text-lg font-semibold text-accent">
                From ${trip.daily_rate.toLocaleString()}/day
              </p>
            ) : trip.category === "cruise" ? (
              <>
                <p className="text-lg font-semibold text-accent">
                  ${trip.base_price.toLocaleString()}
                </p>
                {trip.deposit_amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Deposit: ${trip.deposit_amount.toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg font-semibold text-accent">
                ${trip.base_price.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
