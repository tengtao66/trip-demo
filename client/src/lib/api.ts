import type { Trip } from "@/types/trip";

export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch("/api/trips");
  return res.json();
}

export async function fetchTrip(slug: string): Promise<Trip> {
  const res = await fetch(`/api/trips/${slug}`);
  if (!res.ok) throw new Error("Trip not found");
  return res.json();
}
