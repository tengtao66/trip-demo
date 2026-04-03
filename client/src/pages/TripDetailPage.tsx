import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { fetchTrip } from "@/lib/api";
import { tripImages } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/types/trip";

function PricingSidebar({ trip }: { trip: Trip }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 sticky top-24">
      {trip.payment_flow === "authorize" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            Total ${trip.base_price.toLocaleString()}
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Deposit now: ${trip.deposit_amount.toLocaleString()}</p>
            <p>
              Balance: $
              {(trip.base_price - trip.deposit_amount).toLocaleString()}
            </p>
          </div>
        </>
      )}

      {trip.payment_flow === "vault" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            Setup fee: ${trip.deposit_amount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Add-ons during trip</p>
        </>
      )}

      {trip.payment_flow === "invoice" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            Starting from ${trip.base_price.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Custom quote</p>
        </>
      )}

      <Link to={`/checkout/${trip.slug}`} className="block w-full">
        <Button className="w-full cursor-pointer">
          {trip.payment_flow === "invoice" ? "Design Your Trip" : "Book Now"}
        </Button>
      </Link>
    </div>
  );
}

export default function TripDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchTrip(slug)
      .then(setTrip)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xl text-muted-foreground mb-4">Trip not found</p>
        <Link to="/" className="text-primary underline">
          Back to tours
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tours
        </Link>
      </div>

      {/* Hero banner — split layout: text left, image right */}
      <div className="max-w-6xl mx-auto px-6 mt-4">
        <div
          className="rounded-2xl overflow-hidden flex"
          style={{ background: trip.image_gradient, minHeight: "280px" }}
        >
          {/* Left: text content */}
          <div className="flex-1 flex flex-col justify-center p-10 text-white">
            <h1 className="text-3xl font-bold leading-tight">{trip.name}</h1>
            <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-md">
              {trip.description}
            </p>
            <p className="mt-4 text-white/70 text-sm flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
            </p>
          </div>
          {/* Right: image (if available) */}
          {tripImages[trip.slug] && (
            <div className="w-2/5 relative">
              <img
                src={tripImages[trip.slug]}
                alt={trip.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: description + itinerary */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              About This Trip
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {trip.description}
            </p>
          </div>

          {trip.itinerary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Itinerary
              </h2>
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-border" />

                <div className="space-y-6">
                  {trip.itinerary.map((day) => (
                    <div key={day.day} className="relative">
                      {/* Day circle */}
                      <div className="absolute -left-8 top-0.5 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {day.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {day.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: pricing sidebar */}
        <div>
          <PricingSidebar trip={trip} />
        </div>
      </div>
    </div>
  );
}
