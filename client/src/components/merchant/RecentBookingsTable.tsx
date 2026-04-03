import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";

interface Booking {
  id: string;
  booking_reference: string;
  customer_name: string;
  trip_name: string;
  payment_flow: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  authorization_id: string | null;
  vault_token_id: string | null;
}

const FLOW_BADGE: Record<string, string> = {
  authorize: "bg-[#5C3D2E]/10 text-[#5C3D2E]",
  vault: "bg-[#A0522D]/10 text-[#A0522D]",
  invoice: "bg-[#86A873]/10 text-[#86A873]",
};

const STATUS_BADGE: Record<string, string> = {
  DEPOSIT_CAPTURED: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FULLY_CAPTURED: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-800",
  AWAITING_DEPOSIT: "bg-yellow-100 text-yellow-800",
  DEPOSIT_RECEIVED: "bg-teal-100 text-teal-800",
};

export default function RecentBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    authFetch("/api/bookings")
      .then((r) => r.json())
      .then((data: Booking[]) => setBookings(data.slice(0, 10)))
      .catch(console.error);
  }, []);

  const getAction = (b: Booking) => {
    if (b.payment_flow === "authorize" && b.status === "DEPOSIT_CAPTURED") {
      return { label: "Capture", variant: "default" as const };
    }
    if (
      b.payment_flow === "vault" &&
      (b.status === "ACTIVE" || b.status === "IN_PROGRESS")
    ) {
      return { label: "Charge", variant: "default" as const };
    }
    return { label: "View", variant: "outline" as const };
  };

  const handleAction = (b: Booking) => {
    if (b.payment_flow === "authorize") {
      navigate(`/merchant/bookings/authorize/${b.id}`);
    } else if (b.payment_flow === "vault") {
      navigate(`/merchant/bookings/vault/${b.id}`);
    } else {
      navigate(`/merchant/bookings/${b.id}`);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No bookings yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-3 font-medium text-muted-foreground">Customer</th>
            <th className="py-3 px-3 font-medium text-muted-foreground">Trip</th>
            <th className="py-3 px-3 font-medium text-muted-foreground">Flow</th>
            <th className="py-3 px-3 font-medium text-muted-foreground">Status</th>
            <th className="py-3 px-3 font-medium text-muted-foreground text-right">Amount</th>
            <th className="py-3 px-3 font-medium text-muted-foreground text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const action = getAction(b);
            return (
              <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-medium text-foreground">
                  {b.customer_name}
                </td>
                <td className="py-3 px-3 text-foreground">{b.trip_name}</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      FLOW_BADGE[b.payment_flow] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.payment_flow}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[b.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-medium text-foreground">
                  ${b.total_amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-3 px-3 text-right">
                  <Button
                    size="sm"
                    variant={action.variant}
                    onClick={() => handleAction(b)}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
