import { Router } from "express";
import db from "../services/db.js";
import type { Trip } from "../types/trip.js";

const router = Router();

router.get("/trips", (_req, res) => {
  const rows = db.prepare("SELECT * FROM trips").all() as Array<
    Omit<Trip, "itinerary"> & { itinerary: string }
  >;

  const trips: Trip[] = rows.map((row) => ({
    ...row,
    itinerary: JSON.parse(row.itinerary),
  }));

  res.json(trips);
});

router.get("/trips/:slug", (req, res) => {
  const row = db
    .prepare("SELECT * FROM trips WHERE slug = ?")
    .get(req.params.slug) as (Omit<Trip, "itinerary"> & { itinerary: string }) | undefined;

  if (!row) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const trip: Trip = {
    ...row,
    itinerary: JSON.parse(row.itinerary),
  };

  res.json(trip);
});

export default router;
