import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../services/db.js";
import { getPayPalAccessToken, PAYPAL_BASE_URL } from "../services/paypal.js";
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
  vault_token_id: string | null;
  created_at: string;
  updated_at: string;
}

const router = Router();

// POST /api/vault/:vaultId/charge — Merchant charges using saved vault token
router.post(
  "/vault/:vaultId/charge",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const { vaultId } = req.params;
      const { amount, description, type = "addon" } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Valid amount is required" });
        return;
      }
      if (!description) {
        res.status(400).json({ error: "Description is required" });
        return;
      }

      // Find the booking by vault_token_id
      const booking = db
        .prepare("SELECT * FROM bookings WHERE vault_token_id = ?")
        .get(vaultId) as BookingRow | undefined;
      if (!booking) {
        res.status(404).json({ error: "Booking not found for vault token" });
        return;
      }

      // Create order with vault_id (auto-captures since payment_source is provided)
      const accessToken = await getPayPalAccessToken();
      const orderBody = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
            description,
          },
        ],
        payment_source: {
          paypal: { vault_id: vaultId },
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
        console.error("Vault charge error:", errBody);
        res.status(500).json({ error: "Failed to charge vault token" });
        return;
      }

      const ppData = await ppRes.json();
      const captureId =
        ppData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

      // Insert booking_charge
      const chargeId = randomUUID();
      db.prepare(
        `INSERT INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(chargeId, booking.id, type, description, amount, captureId, "completed");

      // Update booking paid_amount and status
      const newPaid = booking.paid_amount + amount;
      const newStatus =
        booking.status === "ACTIVE" && type === "addon"
          ? "IN_PROGRESS"
          : type === "final"
            ? "COMPLETED"
            : booking.status === "IN_PROGRESS"
              ? "IN_PROGRESS"
              : "IN_PROGRESS";

      db.prepare(
        `UPDATE bookings SET paid_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newPaid, newStatus, booking.id);

      res.json({
        chargeId,
        captureId,
        amount,
        description,
        type,
        status: "completed",
        bookingStatus: newStatus,
        paidAmount: newPaid,
      });
    } catch (err: any) {
      console.error("Vault charge error:", err);
      res.status(500).json({ error: "Failed to process vault charge" });
    }
  }
);

// DELETE /api/vault/:vaultId — Delete vault payment token
router.delete(
  "/vault/:vaultId",
  requireRole("merchant"),
  async (req, res) => {
    try {
      const { vaultId } = req.params;

      const accessToken = await getPayPalAccessToken();

      const ppRes = await fetch(
        `${PAYPAL_BASE_URL}/v3/vault/payment-tokens/${vaultId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 204 = success, 404 = already deleted
      if (!ppRes.ok && ppRes.status !== 204 && ppRes.status !== 404) {
        const errBody = await ppRes.text();
        console.error("Delete vault token error:", errBody);
        res.status(500).json({ error: "Failed to delete vault token" });
        return;
      }

      // Clear vault_token_id on the booking
      db.prepare(
        `UPDATE bookings SET vault_token_id = NULL, updated_at = datetime('now')
         WHERE vault_token_id = ?`
      ).run(vaultId);

      res.json({ deleted: true });
    } catch (err: any) {
      console.error("Delete vault token error:", err);
      res.status(500).json({ error: "Failed to delete vault token" });
    }
  }
);

export default router;
