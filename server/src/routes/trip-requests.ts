import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../services/db.js";
import { requireRole } from "../middleware/auth.js";
import { generateBookingReference } from "../lib/pnr.js";
import { getPayPalAccessToken, PAYPAL_BASE_URL } from "../services/paypal.js";

// Destination/activity pricing — must match client/src/data/destinations.ts
const DESTINATION_PRICES: Record<string, number> = {
  paris: 1200,
  rome: 1000,
  santorini: 1500,
  barcelona: 900,
  "swiss-alps": 1800,
  amsterdam: 800,
};

const ACTIVITY_PRICES: Record<string, number> = {
  museum: 150,
  wine: 100,
  cooking: 120,
  boat: 200,
};

const router = Router();

// POST /api/trip-requests — Submit a custom trip request (customer)
router.post(
  "/trip-requests",
  requireRole("customer"),
  async (req, res) => {
    try {
      const userEmail = res.locals.userEmail as string;
      const { email, startDate, endDate, destinations, activities, notes } =
        req.body;

      if (
        !email ||
        !startDate ||
        !endDate ||
        !Array.isArray(destinations) ||
        destinations.length === 0
      ) {
        res
          .status(400)
          .json({ error: "Missing required fields" });
        return;
      }

      // Find user
      const user = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(userEmail) as { id: string } | undefined;
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Server-side recalculate total
      let totalEstimate = 0;
      for (const destId of destinations) {
        const price = DESTINATION_PRICES[destId];
        if (price == null) {
          res
            .status(400)
            .json({ error: `Unknown destination: ${destId}` });
          return;
        }
        totalEstimate += price;
      }
      if (Array.isArray(activities)) {
        for (const actId of activities) {
          const price = ACTIVITY_PRICES[actId];
          if (price == null) {
            res
              .status(400)
              .json({ error: `Unknown activity: ${actId}` });
            return;
          }
          totalEstimate += price;
        }
      }

      const depositAmount = Math.round(totalEstimate * 0.4 * 100) / 100;
      const balanceAmount =
        Math.round((totalEstimate - depositAmount) * 100) / 100;

      const id = randomUUID();

      // Create booking record
      const bookingId = randomUUID();
      const bookingRef = generateBookingReference();
      const euroTrip = db
        .prepare("SELECT id FROM trips WHERE payment_flow = 'invoice' LIMIT 1")
        .get() as { id: string } | undefined;

      // --- Auto-create and send PayPal invoice ---
      let paypalInvoiceId: string | null = null;
      let invoiceUrl: string | null = null;
      let bookingStatus = "REQUEST_SUBMITTED";

      try {
        const accessToken = await getPayPalAccessToken();

        // Build destination/activity names for invoice line items
        const DEST_NAMES: Record<string, string> = {
          paris: "Paris, France", rome: "Rome, Italy", santorini: "Santorini, Greece",
          barcelona: "Barcelona, Spain", "swiss-alps": "Swiss Alps", amsterdam: "Amsterdam, Netherlands",
        };
        const ACT_NAMES: Record<string, string> = {
          museum: "Guided Museum Tour", wine: "Wine Tasting",
          cooking: "Cooking Class", boat: "Boat Excursion",
        };

        const invoiceItems = [
          {
            name: "European Grand Tour — Deposit (40%)",
            description: `Destinations: ${destinations.map((d: string) => DEST_NAMES[d] || d).join(", ")}`,
            quantity: "1",
            unit_amount: { currency_code: "USD", value: depositAmount.toFixed(2) },
          },
          {
            name: "European Grand Tour — Balance (60%)",
            description: activities?.length
              ? `Activities: ${(activities as string[]).map((a: string) => ACT_NAMES[a] || a).join(", ")}`
              : "Remaining balance",
            quantity: "1",
            unit_amount: { currency_code: "USD", value: balanceAmount.toFixed(2) },
          },
        ];

        // 1. Create invoice draft
        const createRes = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            detail: {
              currency_code: "USD",
              note: `Custom European Grand Tour — ${destinations.length} destinations`,
              invoice_date: new Date().toISOString().split("T")[0],
              payment_term: { term_type: "NET_30" },
            },
            primary_recipients: [{ billing_info: { email_address: email } }],
            items: invoiceItems,
          }),
        });

        if (createRes.ok) {
          const invoiceData = await createRes.json();
          // PayPal Invoicing API returns { rel, href, method } — extract ID from href
          paypalInvoiceId = invoiceData.id ||
            invoiceData.href?.split("/").pop() ||
            invoiceData.links?.find((l: any) => l.rel === "self")?.href?.split("/").pop();

          console.log("PayPal invoice created:", paypalInvoiceId, "raw response:", JSON.stringify(invoiceData));

          if (paypalInvoiceId) {
            // 2. Send invoice immediately
            const sendRes = await fetch(
              `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${paypalInvoiceId}/send`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ send_to_recipient: true }),
              }
            );

            if (sendRes.ok) {
              bookingStatus = "AWAITING_DEPOSIT";

              // 3. Fetch invoice detail to get recipient_view_url
              const detailRes = await fetch(
                `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${paypalInvoiceId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                invoiceUrl = detailData.detail?.metadata?.recipient_view_url || null;
              }
            }
          }
        }
      } catch (invoiceErr: any) {
        console.error("Auto-invoice creation failed (non-blocking):", invoiceErr);
        // Non-blocking — booking still created, merchant can manually create invoice later
      }

      // Insert booking
      db.prepare(
        `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow,
         total_amount, paid_amount, invoice_id, invoice_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'invoice', ?, 0, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        bookingId,
        bookingRef,
        user.id,
        euroTrip?.id || "t-europe-01",
        bookingStatus,
        totalEstimate,
        paypalInvoiceId,
        invoiceUrl
      );

      // Create trip request linked to booking
      db.prepare(
        `INSERT INTO trip_requests (id, user_id, email, start_date, end_date, destinations, activities, notes, total_estimate, deposit_amount, balance_amount, booking_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, user.id, email, startDate, endDate,
        JSON.stringify(destinations), JSON.stringify(activities || []),
        notes || null, totalEstimate, depositAmount, balanceAmount,
        bookingId, bookingStatus
      );

      res.status(201).json({
        id,
        bookingId,
        bookingReference: bookingRef,
        totalEstimate,
        depositAmount,
        balanceAmount,
        invoiceUrl,
        status: bookingStatus,
      });
    } catch (err: any) {
      console.error("Create trip request error:", err);
      res.status(500).json({ error: "Failed to create trip request" });
    }
  }
);

// GET /api/trip-requests — List all trip requests (merchant)
router.get(
  "/trip-requests",
  requireRole("merchant"),
  (_req, res) => {
    try {
      const requests = db
        .prepare(
          `SELECT tr.*, u.name as customer_name, u.email as customer_email
           FROM trip_requests tr
           JOIN users u ON tr.user_id = u.id
           ORDER BY tr.created_at DESC`
        )
        .all();

      // Parse JSON fields
      const parsed = (requests as any[]).map((r) => ({
        ...r,
        destinations: JSON.parse(r.destinations),
        activities: JSON.parse(r.activities),
      }));

      res.json(parsed);
    } catch (err: any) {
      console.error("List trip requests error:", err);
      res.status(500).json({ error: "Failed to fetch trip requests" });
    }
  }
);

// GET /api/trip-requests/:id — Trip request detail (merchant)
router.get(
  "/trip-requests/:id",
  requireRole("merchant"),
  (req, res) => {
    try {
      const request = db
        .prepare(
          `SELECT tr.*, u.name as customer_name, u.email as customer_email
           FROM trip_requests tr
           JOIN users u ON tr.user_id = u.id
           WHERE tr.id = ?`
        )
        .get(req.params.id) as any;

      if (!request) {
        res.status(404).json({ error: "Trip request not found" });
        return;
      }

      res.json({
        ...request,
        destinations: JSON.parse(request.destinations),
        activities: JSON.parse(request.activities),
      });
    } catch (err: any) {
      console.error("Get trip request error:", err);
      res.status(500).json({ error: "Failed to fetch trip request" });
    }
  }
);

export default router;
