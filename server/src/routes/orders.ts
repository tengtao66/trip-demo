import { Router } from "express";
import { randomUUID } from "crypto";
import PayPalSDK from "@paypal/paypal-server-sdk";
import db from "../services/db.js";
import { ordersController, paymentsController } from "../services/paypal.js";
import { generateBookingReference } from "../lib/pnr.js";
import { requireRole } from "../middleware/auth.js";
import type { Trip } from "../types/trip.js";

const { CheckoutPaymentIntent } = PayPalSDK;

const router = Router();

// POST /api/orders/create — Create PayPal order with intent=AUTHORIZE
router.post("/orders/create", requireRole("customer"), async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      res.status(400).json({ error: "slug is required" });
      return;
    }

    const trip = db
      .prepare("SELECT * FROM trips WHERE slug = ?")
      .get(slug) as Trip | undefined;
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    const { result } = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Authorize,
        purchaseUnits: [
          {
            amount: {
              currencyCode: "USD",
              value: trip.base_price.toFixed(2),
            },
            description: trip.name,
            referenceId: trip.id,
          },
        ],
      },
    });

    res.json({ id: result.id });
  } catch (err: any) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// POST /api/orders/:orderId/authorize — Authorize order, partial-capture deposit
router.post(
  "/orders/:orderId/authorize",
  requireRole("customer"),
  async (req, res) => {
    try {
      const orderId = req.params.orderId as string;
      const userEmail = res.locals.userEmail as string;

      // Look up user
      const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(userEmail) as { id: string } | undefined;
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Authorize the order
      const { result: authResult } = await ordersController.authorizeOrder({
        id: orderId,
        body: {},
      });

      // Extract authorization details
      const purchaseUnit = authResult.purchaseUnits?.[0];
      const authorization = purchaseUnit?.payments?.authorizations?.[0];
      if (!authorization?.id) {
        res.status(500).json({ error: "No authorization returned" });
        return;
      }

      // Look up the trip from the purchase unit reference
      const tripId = purchaseUnit!.referenceId;
      const trip = db
        .prepare("SELECT * FROM trips WHERE id = ?")
        .get(tripId) as Trip | undefined;
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }

      // Partial capture the deposit amount (not final capture)
      const { result: captureResult } =
        await paymentsController.captureAuthorizedPayment({
          authorizationId: authorization.id,
          body: {
            amount: {
              currencyCode: "USD",
              value: trip.deposit_amount.toFixed(2),
            },
            finalCapture: false,
          },
        });

      const captureId = captureResult.id;

      // Calculate authorization expiry (29 days from now for PayPal)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 29);

      // Save booking
      const bookingId = randomUUID();
      const bookingRef = generateBookingReference();

      db.prepare(
        `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow,
         total_amount, paid_amount, paypal_order_id, authorization_id, authorization_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        bookingId,
        bookingRef,
        user.id,
        trip.id,
        "DEPOSIT_CAPTURED",
        "authorize",
        trip.base_price,
        trip.deposit_amount,
        orderId,
        authorization.id,
        expiresAt.toISOString()
      );

      // Save deposit charge
      const chargeId = randomUUID();
      db.prepare(
        `INSERT INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        chargeId,
        bookingId,
        "deposit",
        `Deposit for ${trip.name}`,
        trip.deposit_amount,
        captureId,
        "completed"
      );

      res.json({
        bookingId,
        bookingReference: bookingRef,
        status: "DEPOSIT_CAPTURED",
        depositAmount: trip.deposit_amount,
        totalAmount: trip.base_price,
        balanceRemaining: trip.base_price - trip.deposit_amount,
      });
    } catch (err: any) {
      console.error("Authorize order error:", err);
      res.status(500).json({ error: "Failed to authorize order" });
    }
  }
);

export default router;
