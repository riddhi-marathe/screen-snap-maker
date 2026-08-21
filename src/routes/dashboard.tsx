import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/eg/AppShell";
import { WorldMap } from "@/components/eg/WorldMap";
import { Kpi, Panel, RiskBar, StatusPill } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { GEO_EVENTS, BASELINE } from "@/lib/eg/data";
import { buildPlaybook } from "@/lib/eg/engine";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Dashboard — EnergyGuard AI" },
      {
        name: "description",
        content:
          "National energy resilience index, corridor risk, supply gap, SPR runway and live digital twin of crude import flows.",
      },
      { property: "og:title", content: "Command Dashboard — EnergyGuard AI" },
      { property: "og:description", content: "Live energy security posture and digital twin of crude import flows." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { result, params } = useEnergyGuard();
  const playbook = buildPlaybook(params, result).slice(0, 3);

  return (
    <AppShell
      title="Command Dashboard"
      subtitle="National crude import posture, corridor risk and digital twin of live flows"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi
          label="Resilience Index"
          value={result.resilienceIndex.toFixed(0)}
          unit="/100"
          tone={result.resilienceIndex > 70 ? "good" : result.resilienceIndex > 50 ? "warn" : "bad"}
          hint={`Posture: ${result.severity}`}
        />
        <Kpi
          label="Import Exposure"
          value={((result.requiredImportsMbd / result.demandMbd) * 100).toFixed(1)}
          unit="%"
          delta={`${result.requiredImportsMbd.toFixed(2)} mb/d imported`}
        />
        <Kpi
          label="Avg Corridor Risk"
          value={result.avgCorridorRisk.toFixed(0)}
          unit="/100"
          tone={result.avgCorridorRisk > 70 ? "bad" : result.avgCorridorRisk > 50 ? "warn" : "good"}
          delta="flow-weighted"
        />
        <Kpi
          label="SPR Runway"
          value={result.sprRunwayDays > 900 ? "∞" : result.sprRunwayDays.toFixed(0)}
          unit="days"
          tone={result.sprRunwayDays > 60 ? "good" : result.sprRunwayDays > 25 ? "warn" : "bad"}
          delta={`${result.sprUsableMMbbl.toFixed(1)} MMbbl usable`}
        />
        <Kpi
          label="Supply Gap"
          value={result.supplyGapMbd.toFixed(2)}
          unit="mb/d"
          tone={result.supplyGapMbd > 0.4 ? "bad" : result.supplyGapMbd > 0.05 ? "warn" : "good"}
          delta={`${result.gapPct.toFixed(1)}% of imports`}
        />
        <Kpi
          label="Avg Landed Cost"
          value={`$${result.landedCost.toFixed(1)}`}
          unit="/bbl"
          delta={`Brent $${result.brent.toFixed(1)} · base $${BASELINE.brent}`}
          tone={result.landedCost > BASELINE.brent * 1.15 ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel eyebrow="Digital twin" title="Maritime flow & chokepoint status">
          <WorldMap />
          <p className="mt-3 text-xs text-muted-foreground">
            Click any vessel, chokepoint, terminal, port or reserve site for live detail. Vessel colour reflects
            transit status under the active scenario.
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel eyebrow="Risk intelligence" title="Corridor risk matrix">
            <div className="space-y-3">
              {result.corridorRisk.map((c) => (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-foreground">{c.name}</span>
                    <span className="num text-muted-foreground">
                      {c.risk} · {c.flow.toFixed(2)} mb/d
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <RiskBar value={c.risk} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/risk" className="mt-4 inline-block text-xs text-primary hover:underline">
              Open full risk intelligence →
            </Link>
          </Panel>

          <Panel eyebrow="Agentic output" title="Priority crisis actions">
            <ol className="space-y-3">
              {playbook.map((a, i) => (
                <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="label-eyebrow">{a.horizon} · {a.owner}</span>
                    <span className="num text-[10px] text-primary">{a.confidence}%</span>
                  </div>
                  <p className="mt-1.5 text-xs text-foreground">{a.action}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.impact}</p>
                </li>
              ))}
            </ol>
            <Link to="/planner" className="mt-4 inline-block text-xs text-primary hover:underline">
              Open AI crisis planner →
            </Link>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel eyebrow="90-day outlook" title="Demand vs deliverable supply">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.forecast}>
                <defs>
                  <linearGradient id="gSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" opacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="demand" stroke="var(--color-warning)" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="withSpr" stroke="var(--color-primary)" fill="url(#gSupply)" strokeWidth={2} />
                <Area type="monotone" dataKey="gap" stroke="var(--color-critical)" fill="var(--color-critical)" fillOpacity={0.18} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Signals" title="Geopolitical event stream">
          <ul className="space-y-3">
            {GEO_EVENTS.slice(0, 5).map((e) => (
              <li key={e.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={e.severity} />
                  <span className="num text-[10px] text-muted-foreground">{e.time}</span>
                </div>
                <p className="mt-1.5 text-xs text-foreground">{e.headline}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {e.source} · risk {e.riskDelta > 0 ? "+" : ""}
                  {e.riskDelta}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
