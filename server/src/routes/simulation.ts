import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../services/db.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

// POST /api/simulation/seed — Create a mock vault booking for simulation
router.post("/simulation/seed", requireRole("merchant"), (_req, res) => {
  try {
    // Use the first customer in the system
    const customer = db
      .prepare("SELECT id, email FROM users WHERE role = 'customer' LIMIT 1")
      .get() as { id: string; email: string } | undefined;
    if (!customer) {
      res.status(500).json({ error: "No customer found for simulation" });
      return;
    }

    // Use the vault-flow trip (Bali)
    const trip = db
      .prepare("SELECT * FROM trips WHERE payment_flow = 'vault' LIMIT 1")
      .get() as any;
    if (!trip) {
      res.status(500).json({ error: "No vault trip found for simulation" });
      return;
    }

    const bookingId = randomUUID();
    const vaultTokenId = `sim_vault_demo_${Date.now()}`;
    const ref = `TERRA-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(
      `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow,
       total_amount, paid_amount, vault_token_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', 'vault', ?, 500, ?, datetime('now'), datetime('now'))`
    ).run(bookingId, ref, customer.id, trip.id, trip.base_price, vaultTokenId);

    // Create setup_fee charge
    const chargeId = randomUUID();
    db.prepare(
      `INSERT INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at)
       VALUES (?, ?, 'setup_fee', 'Simulation setup fee', 500, ?, 'completed', datetime('now'))`
    ).run(chargeId, bookingId, `sim_cap_${Date.now()}`);

    res.json({
      bookingId,
      bookingReference: ref,
      vaultTokenId,
      tripName: trip.name,
      totalAmount: trip.base_price,
      paidAmount: 500,
    });
  } catch (err: any) {
    console.error("Simulation seed error:", err);
    res.status(500).json({ error: "Failed to seed simulation" });
  }
});

export default router;
