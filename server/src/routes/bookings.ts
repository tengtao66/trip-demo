import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../services/db.js";
import { paymentsController } from "../services/paypal.js";
import { requireRole } from "../middleware/auth.js";

interface BookingRow {
  id: string;
  booking_reference: string;
  user_id: string;
  trip_id: string;
  status: string;
  payment_flow: string;
  total_amount: number;
  paid_amount: number;
  paypal_order_id: string | null;
  authorization_id: string | null;
  authorization_expires_at: string | null;
  vault_token_id: string | null;
  invoice_id: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ChargeRow {
  id: string;
  booking_id: string;
  type: string;
  description: string;
  amount: number;
  paypal_capture_id: string | null;
  status: string;
  created_at: string;
}

const router = Router();

// GET /api/bookings — List bookings (customer sees own, merchant sees all)
router.get("/bookings", requireRole("customer", "merchant"), (req, res) => {
  const userEmail = res.locals.userEmail as string;
  const userRole = res.locals.userRole as string;

  let bookings: any[];

  if (userRole === "merchant") {
    bookings = db
      .prepare(
        `SELECT b.*, t.name as trip_name, t.slug as trip_slug, t.image_gradient,
                u.name as customer_name, u.email as customer_email
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         JOIN users u ON b.user_id = u.id
         ORDER BY b.created_at DESC`
      )
      .all();
  } else {
    const user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(userEmail) as { id: string } | undefined;
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    bookings = db
      .prepare(
        `SELECT b.*, t.name as trip_name, t.slug as trip_slug, t.image_gradient
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(user.id);
  }

  res.json(bookings);
});

// GET /api/bookings/:id — Booking detail with charges
router.get(
  "/bookings/:id",
  requireRole("customer", "merchant"),
  (req, res) => {
    const id = req.params.id as string;
    const userEmail = res.locals.userEmail as string;
    const userRole = res.locals.userRole as string;

    // Accept lookup by UUID or booking reference (TERRA-XXXX)
    const isRef = id.startsWith("TERRA-");
    const booking = db
      .prepare(
        `SELECT b.*, t.name as trip_name, t.slug as trip_slug, t.image_gradient,
                t.base_price, t.deposit_amount as trip_deposit_amount, t.duration_days,
                t.description as trip_description, t.payment_flow as trip_payment_flow,
                u.name as customer_name, u.email as customer_email
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         JOIN users u ON b.user_id = u.id
         WHERE ${isRef ? "b.booking_reference" : "b.id"} = ?`
      )
      .get(id) as any;

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    // Customers can only view their own bookings
    if (userRole === "customer") {
      const user = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(userEmail) as { id: string } | undefined;
      if (!user || booking.user_id !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    const charges = db
      .prepare(
        "SELECT * FROM booking_charges WHERE booking_id = ? ORDER BY created_at ASC"
      )
      .all(booking.id) as ChargeRow[];

    res.json({ ...booking, charges });
  }
);

// POST /api/payments/authorizations/:authId/capture — Capture remaining balance
router.post(
  "/payments/authorizations/:authId/capture",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const authId = req.params.authId as string;

      // Find the booking by authorization_id
      const booking = db
        .prepare("SELECT * FROM bookings WHERE authorization_id = ?")
        .get(authId) as BookingRow | undefined;
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      if (booking.status === "FULLY_CAPTURED") {
        res.status(400).json({ error: "Balance already captured" });
        return;
      }

      if (booking.status === "VOIDED") {
        res.status(400).json({ error: "Authorization has been voided" });
        return;
      }

      const balanceAmount = booking.total_amount - booking.paid_amount;
      if (balanceAmount <= 0) {
        res.status(400).json({ error: "No balance remaining" });
        return;
      }

      // Capture the remaining balance (final capture)
      const { result: captureResult } =
        await paymentsController.captureAuthorizedPayment({
          authorizationId: authId,
          body: {
            amount: {
              currencyCode: "USD",
              value: balanceAmount.toFixed(2),
            },
            finalCapture: true,
          },
        });

      const captureId = captureResult.id;

      // Update booking
      db.prepare(
        `UPDATE bookings SET status = 'FULLY_CAPTURED', paid_amount = total_amount,
         updated_at = datetime('now') WHERE id = ?`
      ).run(booking.id);

      // Save balance charge
      const chargeId = randomUUID();
      const trip = db
        .prepare("SELECT name FROM trips WHERE id = ?")
        .get(booking.trip_id) as { name: string };
      db.prepare(
        `INSERT INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        chargeId,
        booking.id,
        "balance",
        `Balance capture for ${trip.name}`,
        balanceAmount,
        captureId,
        "completed"
      );

      res.json({
        status: "FULLY_CAPTURED",
        captureId,
        amountCaptured: balanceAmount,
      });
    } catch (err: any) {
      console.error("Capture balance error:", err);
      res.status(500).json({ error: "Failed to capture balance" });
    }
  }
);

// POST /api/payments/authorizations/:authId/void — Void authorization
router.post(
  "/payments/authorizations/:authId/void",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const authId = req.params.authId as string;

      const booking = db
        .prepare("SELECT * FROM bookings WHERE authorization_id = ?")
        .get(authId) as BookingRow | undefined;
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      if (booking.status === "VOIDED") {
        res.status(400).json({ error: "Already voided" });
        return;
      }

      if (booking.status === "FULLY_CAPTURED") {
        res.status(400).json({ error: "Cannot void a fully captured authorization" });
        return;
      }

      // Void the authorization
      await paymentsController.voidPayment({
        authorizationId: authId,
      });

      // Update booking
      db.prepare(
        `UPDATE bookings SET status = 'VOIDED', updated_at = datetime('now') WHERE id = ?`
      ).run(booking.id);

      res.json({ status: "VOIDED" });
    } catch (err: any) {
      console.error("Void authorization error:", err);
      res.status(500).json({ error: "Failed to void authorization" });
    }
  }
);

export default router;
