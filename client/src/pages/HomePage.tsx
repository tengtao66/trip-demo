import { useEffect, useState } from "react";
import { fetchTrips } from "@/lib/api";
import TripCard from "@/components/trips/TripCard";
import type { Trip } from "@/types/trip";

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section — split: text left, image right */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
          <h1 className="text-4xl font-semibold">Guided Tour Packages</h1>
          <p className="mt-2 text-primary-foreground/80 text-lg">
            Book curated trips with flexible payment options
          </p>
        </div>
        {/* Right-half background image */}
        <div className="absolute inset-y-0 right-0 w-1/2">
          <img
            src="/guided-tour-16.webp"
            alt="Guided tours"
            className="w-full h-full object-cover"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%)",
            }}
          />
        </div>
      </section>

      {/* Trip Card Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-primary mb-6">
          Featured Journeys
        </h2>

        {loading ? (
          <p className="text-muted-foreground">Loading trips...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
