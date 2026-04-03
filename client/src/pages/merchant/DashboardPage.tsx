import { useEffect, useState } from "react";
import StatCards from "@/components/merchant/StatCards";
import RevenueByFlowChart from "@/components/merchant/RevenueByFlowChart";
import BookingsTrendChart from "@/components/merchant/BookingsTrendChart";
import MonthlyRevenueChart from "@/components/merchant/MonthlyRevenueChart";
import RecentBookingsTable from "@/components/merchant/RecentBookingsTable";
import SimulationPanel from "@/components/merchant/SimulationPanel";
import { authFetch } from "@/lib/auth-fetch";

interface ChartData {
  revenueByFlow: { flow: string; total: number }[];
  dailyBookings: { date: string; count: number }[];
  monthlyRevenue: { month: string; type: string; total: number }[];
}

export default function DashboardPage() {
  const [charts, setCharts] = useState<ChartData | null>(null);

  useEffect(() => {
    authFetch("/api/merchant/charts")
      .then((r) => r.json())
      .then(setCharts)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of bookings, revenue, and payment activity
        </p>
      </div>

      {/* KPI Cards */}
      <StatCards />

      {/* Charts row: donut 1/3 + line 2/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Revenue by Flow
          </h2>
          <RevenueByFlowChart data={charts?.revenueByFlow ?? []} />
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Bookings Trend (30 days)
          </h2>
          <BookingsTrendChart data={charts?.dailyBookings ?? []} />
        </div>
      </div>

      {/* Stacked bar chart full width */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Monthly Revenue Breakdown
        </h2>
        <MonthlyRevenueChart data={charts?.monthlyRevenue ?? []} />
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Recent Bookings
        </h2>
        <RecentBookingsTable />
      </div>

      {/* Simulation */}
      <SimulationPanel />
    </div>
  );
}
