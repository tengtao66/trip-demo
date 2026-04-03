import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

interface Props {
  data: { flow: string; total: number }[];
}

const FLOW_COLORS: Record<string, string> = {
  authorize: "#5C3D2E",
  vault: "#A0522D",
  invoice: "#86A873",
};

const FLOW_LABELS: Record<string, string> = {
  authorize: "Authorize",
  vault: "Vault",
  invoice: "Invoice",
};

export default function RevenueByFlowChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const chartData = data.map((d) => ({
    name: FLOW_LABELS[d.flow] ?? d.flow,
    value: d.total,
    fill: FLOW_COLORS[d.flow] ?? "#999",
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No revenue data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          strokeWidth={2}
          stroke="var(--background)"
        >
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Pie>
        {/* Center label */}
        <text
          x="50%"
          y="42%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          ${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </text>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{ fontSize: 11 }}
        >
          Total Revenue
        </text>
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-foreground ml-1">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
