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
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-semibold">Guided Tour Packages</h1>
          <p className="mt-2 text-primary-foreground/80 text-lg">
            Book curated trips with flexible payment options
          </p>
        </div>
      </section>

      {/* Trip Card Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
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
