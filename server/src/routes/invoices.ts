import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../services/db.js";
import { requireRole } from "../middleware/auth.js";
import { getPayPalAccessToken, PAYPAL_BASE_URL } from "../services/paypal.js";

// Destination/activity names for invoice line items
const DESTINATION_NAMES: Record<string, string> = {
  paris: "Paris, France",
  rome: "Rome, Italy",
  santorini: "Santorini, Greece",
  barcelona: "Barcelona, Spain",
  "swiss-alps": "Swiss Alps",
  amsterdam: "Amsterdam, Netherlands",
};

const ACTIVITY_NAMES: Record<string, string> = {
  museum: "Guided Museum Tour",
  wine: "Wine Tasting",
  cooking: "Cooking Class",
  boat: "Boat Excursion",
};

function generateBookingRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "TERRA-";
  for (let i = 0; i < 4; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

const router = Router();

// POST /api/invoices/create — Create a PayPal invoice from a trip request
router.post(
  "/invoices/create",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const { tripRequestId } = req.body;
      if (!tripRequestId) {
        res.status(400).json({ error: "tripRequestId is required" });
        return;
      }

      // Load trip request
      const tripReq = db
        .prepare(
          `SELECT tr.*, u.name as customer_name
           FROM trip_requests tr
           JOIN users u ON tr.user_id = u.id
           WHERE tr.id = ?`
        )
        .get(tripRequestId) as any;

      if (!tripReq) {
        res.status(404).json({ error: "Trip request not found" });
        return;
      }

      if (tripReq.booking_id) {
        res
          .status(400)
          .json({ error: "Invoice already created for this request" });
        return;
      }

      const destinations: string[] = JSON.parse(tripReq.destinations);
      const activities: string[] = JSON.parse(tripReq.activities);
      const depositAmount = tripReq.deposit_amount;
      const balanceAmount = tripReq.balance_amount;

      // Build invoice description with destinations and activities
      const destNames = destinations
        .map((id) => DESTINATION_NAMES[id] || id)
        .join(", ");
      const actNames = activities
        .map((id) => ACTIVITY_NAMES[id] || id)
        .join(", ");

      let description = `Custom European Grand Tour\nDestinations: ${destNames}`;
      if (actNames) description += `\nActivities: ${actNames}`;
      if (tripReq.notes) description += `\nNotes: ${tripReq.notes}`;

      // Create PayPal invoice
      const accessToken = await getPayPalAccessToken();

      const invoicePayload = {
        detail: {
          invoice_number: `TERRA-INV-${Date.now()}`,
          currency_code: "USD",
          note: description,
          payment_term: {
            term_type: "NET_30",
          },
        },
        invoicer: {
          name: {
            given_name: "TERRA",
            surname: "Tours",
          },
          email_address: "merchant@terra.demo",
        },
        primary_recipients: [
          {
            billing_info: {
              name: {
                given_name: tripReq.customer_name.split(" ")[0] || "Customer",
                surname:
                  tripReq.customer_name.split(" ").slice(1).join(" ") || "",
              },
              email_address: tripReq.email,
            },
          },
        ],
        items: [
          {
            name: "European Grand Tour — Deposit",
            description: `40% deposit for custom tour (${destNames})`,
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: depositAmount.toFixed(2),
            },
          },
          {
            name: "European Grand Tour — Balance",
            description: `Remaining 60% balance due before trip`,
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: balanceAmount.toFixed(2),
            },
          },
        ],
      };

      const createRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/invoicing/invoices`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoicePayload),
        }
      );

      if (!createRes.ok) {
        const errBody = await createRes.text();
        console.error("PayPal create invoice error:", errBody);
        res
          .status(500)
          .json({ error: "Failed to create PayPal invoice" });
        return;
      }

      // PayPal returns the invoice href in the Location header or the response body
      const invoiceData = await createRes.json();
      // PayPal Invoicing API returns { rel, href, method } — extract ID from href
      const paypalInvoiceId =
        invoiceData.id ||
        invoiceData.href?.split("/").pop() ||
        invoiceData.links?.find((l: any) => l.rel === "self")?.href?.split("/").pop();

      if (!paypalInvoiceId) {
        console.error("No invoice ID returned from PayPal:", invoiceData);
        res.status(500).json({ error: "No invoice ID returned" });
        return;
      }

      // Fetch the full invoice to get recipient_view_url
      const detailRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${paypalInvoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let invoiceUrl = "";
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        invoiceUrl =
          detailData.detail?.metadata?.recipient_view_url || "";
      }

      // Create a booking record
      const bookingId = randomUUID();
      const bookingRef = generateBookingRef();

      // Find the European tour trip
      const euroTrip = db
        .prepare("SELECT id FROM trips WHERE slug = 'custom-european-tour'")
        .get() as { id: string } | undefined;
      const tripId = euroTrip?.id || "t-europe-01";

      db.prepare(
        `INSERT INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, invoice_id, invoice_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'INVOICE_CREATED', 'invoice', ?, 0, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        bookingId,
        bookingRef,
        tripReq.user_id,
        tripId,
        tripReq.total_estimate,
        paypalInvoiceId,
        invoiceUrl
      );

      // Update trip request with booking_id and status
      db.prepare(
        `UPDATE trip_requests SET booking_id = ?, status = 'INVOICE_CREATED' WHERE id = ?`
      ).run(bookingId, tripRequestId);

      res.json({
        bookingId,
        bookingReference: bookingRef,
        invoiceId: paypalInvoiceId,
        invoiceUrl,
      });
    } catch (err: any) {
      console.error("Create invoice error:", err);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  }
);

// POST /api/invoices/:id/send — Send a PayPal invoice
router.post(
  "/invoices/:id/send",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;

      // Find the booking
      const booking = db
        .prepare("SELECT * FROM bookings WHERE invoice_id = ?")
        .get(invoiceId) as any;

      if (!booking) {
        res.status(404).json({ error: "Booking not found for this invoice" });
        return;
      }

      const accessToken = await getPayPalAccessToken();

      const sendRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${invoiceId}/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            send_to_recipient: true,
          }),
        }
      );

      if (!sendRes.ok) {
        const errBody = await sendRes.text();
        console.error("PayPal send invoice error:", errBody);
        res
          .status(500)
          .json({ error: "Failed to send PayPal invoice" });
        return;
      }

      // After sending, fetch updated invoice detail to get recipient_view_url
      let invoiceUrl = booking.invoice_url || "";
      try {
        const detailRes = await fetch(
          `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${invoiceId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const url = detailData.detail?.metadata?.recipient_view_url;
          if (url) {
            invoiceUrl = url;
            db.prepare(
              `UPDATE bookings SET invoice_url = ? WHERE id = ?`
            ).run(invoiceUrl, booking.id);
          }
        }
      } catch {
        // Non-critical — invoice_url will be populated on next status poll
      }

      // Update booking status
      db.prepare(
        `UPDATE bookings SET status = 'AWAITING_DEPOSIT', updated_at = datetime('now') WHERE id = ?`
      ).run(booking.id);

      // Update trip request status if linked
      db.prepare(
        `UPDATE trip_requests SET status = 'AWAITING_DEPOSIT' WHERE booking_id = ?`
      ).run(booking.id);

      res.json({ status: "AWAITING_DEPOSIT", message: "Invoice sent", invoiceUrl });
    } catch (err: any) {
      console.error("Send invoice error:", err);
      res.status(500).json({ error: "Failed to send invoice" });
    }
  }
);

// GET /api/invoices/:id/status — Poll PayPal invoice status
router.get(
  "/invoices/:id/status",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;

      const booking = db
        .prepare("SELECT * FROM bookings WHERE invoice_id = ?")
        .get(invoiceId) as any;

      if (!booking) {
        res.status(404).json({ error: "Booking not found for this invoice" });
        return;
      }

      const accessToken = await getPayPalAccessToken();

      const statusRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/invoicing/invoices/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!statusRes.ok) {
        const errBody = await statusRes.text();
        console.error("PayPal get invoice error:", errBody);
        res
          .status(500)
          .json({ error: "Failed to fetch invoice status" });
        return;
      }

      const invoiceData = await statusRes.json();
      const paypalStatus = invoiceData.status; // DRAFT, SENT, PARTIALLY_PAID, PAID, etc.

      // Calculate paid amount from payments
      let paidAmount = 0;
      if (invoiceData.payments?.transactions) {
        for (const tx of invoiceData.payments.transactions) {
          if (tx.payment_id) {
            paidAmount += parseFloat(tx.amount?.value || "0");
          }
        }
      }

      // Map PayPal status to our status
      let ourStatus = booking.status;
      if (paypalStatus === "SENT" && paidAmount === 0) {
        ourStatus = "AWAITING_DEPOSIT";
      } else if (paypalStatus === "PARTIALLY_PAID") {
        ourStatus = "DEPOSIT_RECEIVED";
      } else if (paypalStatus === "PAID") {
        ourStatus = "FULLY_PAID";
      }

      // Update booking
      db.prepare(
        `UPDATE bookings SET status = ?, paid_amount = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(ourStatus, paidAmount, booking.id);

      // Update trip request status
      db.prepare(
        `UPDATE trip_requests SET status = ? WHERE booking_id = ?`
      ).run(ourStatus, booking.id);

      // Also update invoice_url if not yet set
      const recipientViewUrl =
        invoiceData.detail?.metadata?.recipient_view_url;
      if (recipientViewUrl && !booking.invoice_url) {
        db.prepare(
          `UPDATE bookings SET invoice_url = ? WHERE id = ?`
        ).run(recipientViewUrl, booking.id);
      }

      res.json({
        status: ourStatus,
        paypalStatus,
        paidAmount,
        totalAmount: booking.total_amount,
        invoiceUrl: recipientViewUrl || booking.invoice_url,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Poll invoice status error:", err);
      res.status(500).json({ error: "Failed to poll invoice status" });
    }
  }
);

export default router;
