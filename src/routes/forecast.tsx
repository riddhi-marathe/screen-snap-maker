import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Supply Gap Forecast — EnergyGuard AI" },
      {
        name: "description",
        content: "90-day projection of crude demand, deliverable supply, reserve-backed cover and price trajectory.",
      },
      { property: "og:title", content: "Supply Gap Forecast — EnergyGuard AI" },
      { property: "og:description", content: "90-day demand, supply and price outlook under the active scenario." },
    ],
  }),
  component: ForecastPage,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function ForecastPage() {
  const { result } = useEnergyGuard();
  const peak = result.forecast.reduce<(typeof result.forecast)[number] | undefined>(
    (a, b) => (!a || b.gap > a.gap ? b : a),
    undefined,
  );

  return (
    <AppShell title="Supply Gap Forecast" subtitle="90-day demand, supply and price trajectory under active scenario">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Current gap" value={result.supplyGapMbd.toFixed(2)} unit="mb/d" tone={result.supplyGapMbd > 0.4 ? "bad" : result.supplyGapMbd > 0.05 ? "warn" : "good"} />
        <Kpi label="Peak projected gap" value={(peak?.gap ?? 0).toFixed(2)} unit="mb/d" delta={peak?.label ?? ""} tone="warn" />
        <Kpi label="Demand" value={result.demandMbd.toFixed(2)} unit="mb/d" delta={`${result.domesticMbd.toFixed(2)} domestic`} />
        <Kpi label="Landed cost" value={`$${result.landedCost.toFixed(1)}`} unit="/bbl" tone={result.landedCost > 95 ? "warn" : "neutral"} />
      </div>

      <Panel eyebrow="Balance" title="Demand vs deliverable supply (with SPR)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.forecast}>
              <defs>
                <linearGradient id="fSupply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" opacity={0.35} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="demand" stroke="var(--color-warning)" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="supply" stroke="var(--color-muted-foreground)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
              <Area type="monotone" dataKey="withSpr" stroke="var(--color-primary)" fill="url(#fSupply)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel eyebrow="Shortfall" title="Projected daily gap">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.forecast}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" opacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="gap" stroke="var(--color-critical)" fill="var(--color-critical)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Market" title="Brent trajectory">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.forecast}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" opacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="price" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
