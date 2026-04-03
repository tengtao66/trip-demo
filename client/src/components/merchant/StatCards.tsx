import { useEffect, useState } from "react";
import { Activity, CreditCard, FileText, DollarSign } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface Stats {
  activeBookings: number;
  pendingCaptures: number;
  openInvoices: number;
  monthlyRevenue: number;
}

const cards = [
  { key: "activeBookings" as const, label: "Active Bookings", icon: Activity, format: (v: number) => String(v) },
  { key: "pendingCaptures" as const, label: "Pending Captures", icon: CreditCard, format: (v: number) => String(v) },
  { key: "openInvoices" as const, label: "Open Invoices", icon: FileText, format: (v: number) => String(v) },
  { key: "monthlyRevenue" as const, label: "Monthly Revenue", icon: DollarSign, format: (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
];

export default function StatCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    authFetch("/api/merchant/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.key} className="rounded-xl border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded mb-3" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{c.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {c.format(stats[c.key])}
            </span>
          </div>
        );
      })}
    </div>
  );
}
