import { Router } from "express";
import { randomUUID } from "crypto";
import PayPalSDK from "@paypal/paypal-server-sdk";
import db from "../services/db.js";
import {
  ordersController,
  paymentsController,
  getPayPalAccessToken,
  PAYPAL_BASE_URL,
} from "../services/paypal.js";
import { generateBookingReference } from "../lib/pnr.js";
import { requireRole } from "../middleware/auth.js";
import type { Trip } from "../types/trip.js";

const { CheckoutPaymentIntent } = PayPalSDK;

const router = Router();

// POST /api/orders/create — Create PayPal order (authorize or vault flow)
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

    if (trip.payment_flow === "vault") {
      // Vault flow: use direct REST call because SDK types may not include
      // payment_source.paypal.attributes.vault
      const accessToken = await getPayPalAccessToken();
      const origin = req.headers.referer || req.headers.origin || "";
      const orderBody = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: trip.deposit_amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: trip.deposit_amount.toFixed(2),
                },
              },
            },
            reference_id: trip.id,
            items: [
              {
                name: "Billing Plan",
                description: `${trip.name} - service plan`,
                unit_amount: {
                  currency_code: "USD",
                  value: trip.deposit_amount.toFixed(2),
                },
                quantity: "1",
                billing_plan: {
                  name: trip.name,
                  setup_fee: {
                    value: trip.deposit_amount.toFixed(2),
                    currency_code: "USD",
                  },
                  billing_cycles: [
                    {
                      tenure_type: "REGULAR",
                      pricing_scheme: {
                        price: {
                          value: "200.00",
                          currency_code: "USD",
                        },
                        pricing_model: "VARIABLE",
                      },
                      frequency: {
                        interval_unit: "DAY",
                        interval_count: 1,
                      },
                      total_cycles: trip.duration_days,
                      sequence: 1,
                    },
                  ],
                },
              },
            ],
          },
        ],
        payment_source: {
          paypal: {
            attributes: {
              vault: {
                store_in_vault: "ON_SUCCESS",
                usage_type: "MERCHANT",
                usage_pattern: "UNSCHEDULED_POSTPAID",
              },
            },
            experience_context: {
              return_url: `${origin}checkout/${trip.slug}?status=approved`,
              cancel_url: `${origin}checkout/${trip.slug}?status=cancelled`,
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              user_action: "PAY_NOW",
            },
          },
        },
      };

      const ppRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderBody),
      });

      if (!ppRes.ok) {
        const errBody = await ppRes.text();
        console.error("PayPal create vault order error:", errBody);
        res.status(500).json({ error: "Failed to create vault order" });
        return;
      }

      const ppData = await ppRes.json();
      res.json({ id: ppData.id });
    } else {
      // Authorize flow (default)
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
    }
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

      // Calculate authorization expiry (29 days from now for PayPal)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 29);

      const bookingId = randomUUID();
      const bookingRef = generateBookingReference();

      // Attempt partial capture of deposit — if it fails, persist booking as DEPOSIT_AUTHORIZED
      let captureId: string | null = null;
      let status = "DEPOSIT_AUTHORIZED";
      let paidAmount = 0;

      try {
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

        captureId = captureResult.id ?? null;
        status = "DEPOSIT_CAPTURED";
        paidAmount = trip.deposit_amount;
      } catch (captureErr: any) {
        console.error("Partial capture failed, saving as DEPOSIT_AUTHORIZED:", captureErr);
        // Continue — booking will be saved with DEPOSIT_AUTHORIZED so merchant can retry
      }

      // Save booking (always — even if capture failed)
      db.prepare(
        `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow,
         total_amount, paid_amount, paypal_order_id, authorization_id, authorization_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        bookingId,
        bookingRef,
        user.id,
        trip.id,
        status,
        "authorize",
        trip.base_price,
        paidAmount,
        orderId,
        authorization.id,
        expiresAt.toISOString()
      );

      // Save deposit charge if capture succeeded
      if (captureId) {
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
      }

      res.json({
        bookingId,
        bookingReference: bookingRef,
        status,
        depositAmount: status === "DEPOSIT_CAPTURED" ? trip.deposit_amount : 0,
        totalAmount: trip.base_price,
        balanceRemaining: trip.base_price - paidAmount,
      });
    } catch (err: any) {
      console.error("Authorize order error:", err);
      res.status(500).json({ error: "Failed to authorize order" });
    }
  }
);

// POST /api/orders/:orderId/capture — Capture order (vault flow)
router.post(
  "/orders/:orderId/capture",
  requireRole("customer"),
  async (req, res) => {
    try {
      const orderId = req.params.orderId as string;
      const userEmail = res.locals.userEmail as string;

      const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(userEmail) as { id: string } | undefined;
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Capture via direct REST (vault orders use payment_source, SDK may differ)
      const accessToken = await getPayPalAccessToken();
      const captureRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!captureRes.ok) {
        const errBody = await captureRes.text();
        console.error("PayPal capture error:", errBody);
        res.status(500).json({ error: "Failed to capture order" });
        return;
      }

      const captureData = await captureRes.json();

      // Verify capture completed
      if (captureData.status !== "COMPLETED") {
        console.error("Vault capture not completed:", captureData.status);
        res.status(400).json({ error: `Capture not completed: ${captureData.status}` });
        return;
      }

      // Extract vault_id from response
      const vaultId =
        captureData.payment_source?.paypal?.attributes?.vault?.id ?? null;

      // Extract capture ID from purchase_units
      const captureId =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

      // Look up the trip from reference_id
      const refId = captureData.purchase_units?.[0]?.reference_id;
      const trip = db
        .prepare("SELECT * FROM trips WHERE id = ?")
        .get(refId) as Trip | undefined;
      if (!trip) {
        res.status(404).json({ error: "Trip not found in order" });
        return;
      }

      const bookingId = randomUUID();
      const bookingRef = generateBookingReference();

      // Insert booking
      db.prepare(
        `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow,
         total_amount, paid_amount, paypal_order_id, vault_token_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        bookingId,
        bookingRef,
        user.id,
        trip.id,
        "ACTIVE",
        "vault",
        trip.base_price,
        trip.deposit_amount,
        orderId,
        vaultId
      );

      // Insert setup_fee charge
      const chargeId = randomUUID();
      db.prepare(
        `INSERT INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        chargeId,
        bookingId,
        "setup_fee",
        `Setup Fee for ${trip.name}`,
        trip.deposit_amount,
        captureId,
        "completed"
      );

      res.json({
        bookingId,
        bookingReference: bookingRef,
        vaultTokenId: vaultId,
      });
    } catch (err: any) {
      console.error("Capture order error:", err);
      res.status(500).json({ error: "Failed to capture order" });
    }
  }
);

export default router;
