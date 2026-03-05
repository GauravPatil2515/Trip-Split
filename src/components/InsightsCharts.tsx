import {
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/data";

const CATEGORY_COLORS = {
    food: "hsl(var(--amber))",     // #F59E0B -> warm amber
    travel: "hsl(var(--primary))",   // #0F766E -> deep teal
    stay: "hsl(220, 70%, 50%)",      // Blue
    activity: "hsl(280, 60%, 50%)",  // Purple
    shopping: "hsl(340, 70%, 50%)",  // Pink
    other: "hsl(var(--muted-foreground))",
};

interface InsightsChartsProps {
    categoryData: { name: string; value: number }[];
    timelineData: { date: string; amount: number }[];
}

export function InsightsCharts({ categoryData, timelineData }: InsightsChartsProps) {
    return (
        <div className="space-y-6">
            {/* Category Donut Chart */}
            <div className="bg-card paper-texture border border-border/80 rounded-3xl p-5 shadow-card">
                <h3 className="text-[14px] font-bold text-foreground mb-4">
                    Spending by Category
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ||
                                            CATEGORY_COLORS.other
                                        }
                                        className="focus:outline-none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    boxShadow: "var(--tw-shadow-card)",
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Legend Custom */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {categoryData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor:
                                        CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ||
                                        CATEGORY_COLORS.other,
                                }}
                            />
                            <span className="text-[12px] font-medium text-muted-foreground flex-1 flex items-center gap-1.5 capitalize">
                                <span>{CATEGORY_ICONS[entry.name as keyof typeof CATEGORY_ICONS]}</span>
                                {CATEGORY_LABELS[entry.name as keyof typeof CATEGORY_LABELS]}
                            </span>
                            <span className="text-[12px] font-bold text-foreground tabular-nums">
                                {Math.round((entry.value / categoryData.reduce((a, b) => a + b.value, 0)) * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spending Over Time Line/Area Chart */}
            <div className="bg-card paper-texture border border-border/80 rounded-3xl p-5 shadow-card">
                <h3 className="text-[14px] font-bold text-foreground mb-4">
                    Spending Over Time
                </h3>
                <div className="h-[200px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val.substring(0, 5)} // e.g., '12-05'
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                dy={10}
                            />
                            <YAxis
                                hide
                                domain={["dataMin - 100", "dataMax + 200"]}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [formatCurrency(value || 0), "Spent"]}
                                labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    boxShadow: "var(--tw-shadow-card)",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
