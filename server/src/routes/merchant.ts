import { Router } from "express";
import db from "../services/db.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

// Terminal statuses — bookings in these states are "done"
const TERMINAL_STATUSES = [
  "COMPLETED",
  "FULLY_CAPTURED",
  "FULLY_PAID",
  "VOIDED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
];

// GET /api/merchant/stats — KPI metrics for the dashboard
router.get("/merchant/stats", requireRole("merchant"), (_req, res) => {
  try {
    const terminalPlaceholders = TERMINAL_STATUSES.map(() => "?").join(",");

    // Active Bookings: NOT in terminal states
    const { count: activeBookings } = db
      .prepare(
        `SELECT COUNT(*) as count FROM bookings WHERE status NOT IN (${terminalPlaceholders})`
      )
      .get(...TERMINAL_STATUSES) as { count: number };

    // Pending Captures: authorize flow, deposit captured but balance not yet captured
    const { count: pendingCaptures } = db
      .prepare(
        `SELECT COUNT(*) as count FROM bookings
         WHERE payment_flow = 'authorize' AND status = 'DEPOSIT_CAPTURED'`
      )
      .get() as { count: number };

    // Open Invoices: invoice flow, awaiting or received deposit
    const { count: openInvoices } = db
      .prepare(
        `SELECT COUNT(*) as count FROM bookings
         WHERE payment_flow = 'invoice' AND status IN ('AWAITING_DEPOSIT', 'DEPOSIT_RECEIVED')`
      )
      .get() as { count: number };

    // Monthly Revenue: sum of completed charges this month
    const { total: monthlyRevenue } = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM booking_charges
         WHERE status = 'completed'
         AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
      )
      .get() as { total: number };

    res.json({ activeBookings, pendingCaptures, openInvoices, monthlyRevenue });
  } catch (err: any) {
    console.error("Merchant stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/merchant/charts — Chart datasets for the dashboard
router.get("/merchant/charts", requireRole("merchant"), (_req, res) => {
  try {
    // Revenue by payment flow
    const revenueByFlow = db
      .prepare(
        `SELECT b.payment_flow as flow, COALESCE(SUM(bc.amount), 0) as total
         FROM booking_charges bc
         JOIN bookings b ON bc.booking_id = b.id
         WHERE bc.status = 'completed'
         GROUP BY b.payment_flow`
      )
      .all() as { flow: string; total: number }[];

    // Daily bookings for last 30 days
    const dailyBookingsRaw = db
      .prepare(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM bookings
         WHERE created_at >= DATE('now', '-30 days')
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      )
      .all() as { date: string; count: number }[];

    // Fill in missing dates with 0
    const dailyBookings: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const existing = dailyBookingsRaw.find((r) => r.date === dateStr);
      dailyBookings.push({ date: dateStr, count: existing?.count ?? 0 });
    }

    // Monthly revenue by charge type
    const monthlyRevenue = db
      .prepare(
        `SELECT strftime('%Y-%m', bc.created_at) as month,
                bc.type,
                COALESCE(SUM(bc.amount), 0) as total
         FROM booking_charges bc
         WHERE bc.status = 'completed'
         GROUP BY month, bc.type
         ORDER BY month ASC`
      )
      .all() as { month: string; type: string; total: number }[];

    res.json({ revenueByFlow, dailyBookings, monthlyRevenue });
  } catch (err: any) {
    console.error("Merchant charts error:", err);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;
