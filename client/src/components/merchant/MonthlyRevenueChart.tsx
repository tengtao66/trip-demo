import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RawRow {
  month: string;
  type: string;
  total: number;
}

interface Props {
  data: RawRow[];
}

const TYPE_COLORS: Record<string, string> = {
  deposit: "#5C3D2E",
  final: "#A0522D",
  addon: "#86A873",
};

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  final: "Final",
  addon: "Add-on",
};

export default function MonthlyRevenueChart({ data }: Props) {
  // Pivot: group by month, columns = charge types
  const monthMap = new Map<string, Record<string, number>>();
  for (const row of data) {
    if (!monthMap.has(row.month)) monthMap.set(row.month, {});
    const entry = monthMap.get(row.month)!;
    entry[row.type] = (entry[row.type] ?? 0) + row.total;
  }

  const chartData = Array.from(monthMap.entries()).map(([month, types]) => ({
    month,
    deposit: types.deposit ?? 0,
    final: types.final ?? 0,
    addon: types.addon ?? 0,
    // Include other types that may exist (balance, setup_fee) in deposit bucket for display
    balance: types.balance ?? 0,
    setup_fee: types.setup_fee ?? 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No monthly revenue data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            TYPE_LABELS[name] ?? name,
          ]}
        />
        <Legend
          iconType="rect"
          iconSize={10}
          formatter={(value: string) => (
            <span className="text-xs text-foreground ml-1">
              {TYPE_LABELS[value] ?? value}
            </span>
          )}
        />
        <Bar dataKey="deposit" stackId="a" fill={TYPE_COLORS.deposit} name="deposit" />
        <Bar dataKey="final" stackId="a" fill={TYPE_COLORS.final} name="final" />
        <Bar dataKey="addon" stackId="a" fill={TYPE_COLORS.addon} name="addon" />
      </BarChart>
    </ResponsiveContainer>
  );
}
