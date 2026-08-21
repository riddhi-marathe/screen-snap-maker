import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel, RiskBar, StatusPill } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { CORRIDORS, GEO_EVENTS } from "@/lib/eg/data";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Intelligence — EnergyGuard AI" },
      {
        name: "description",
        content: "Chokepoint risk scoring, supplier political exposure and the live geopolitical event stream.",
      },
      { property: "og:title", content: "Risk Intelligence — EnergyGuard AI" },
      { property: "og:description", content: "Corridor risk scoring and geopolitical signal feed." },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { result } = useEnergyGuard();
  const worst = [...result.corridorRisk].sort((a, b) => b.risk - a.risk)[0];

  return (
    <AppShell title="Risk Intelligence" subtitle="Chokepoint, supplier and geopolitical exposure analysis">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Avg corridor risk" value={result.avgCorridorRisk.toFixed(0)} unit="/100" tone={result.avgCorridorRisk > 65 ? "bad" : result.avgCorridorRisk > 45 ? "warn" : "good"} />
        <Kpi label="Highest risk corridor" value={worst?.short ?? "—"} delta={`score ${worst?.risk ?? 0}`} tone="warn" />
        <Kpi label="Posture" value={result.severity.toUpperCase()} tone={result.severity === "stable" ? "good" : result.severity === "critical" ? "bad" : "warn"} />
        <Kpi label="Economic impact" value={`₹${result.economicImpactCrPerDay.toFixed(0)}`} unit="cr/day" tone={result.economicImpactCrPerDay > 0 ? "bad" : "good"} />
      </div>

      <Panel eyebrow="Chokepoints" title="Corridor risk matrix">
        <div className="grid gap-4 md:grid-cols-2">
          {result.corridorRisk.map((c) => {
            const meta = CORRIDORS.find((x) => x.id === c.id);
            return (
              <div key={c.id} className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-foreground">{c.name}</p>
                  <span className="num text-xs text-muted-foreground">{c.risk}/100</span>
                </div>
                <div className="mt-2"><RiskBar value={c.risk} /></div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {c.flow.toFixed(2)} mb/d · {meta?.transitDays ?? 0}d transit — {meta?.notes}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel eyebrow="Supplier exposure" title="Political risk vs reliability">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Supplier</th>
                <th className="py-2 pr-3 font-medium">Grade</th>
                <th className="py-2 pr-3 font-medium">Corridor</th>
                <th className="py-2 pr-3 font-medium">Political risk</th>
                <th className="py-2 pr-3 font-medium">Reliability</th>
                <th className="py-2 pr-3 font-medium">Available mb/d</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.supplierPlan.map((r) => (
                <tr key={r.supplier.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 text-foreground">{r.supplier.country}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.supplier.grade}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.supplier.corridor}</td>
                  <td className="py-2 pr-3 w-32"><RiskBar value={r.supplier.politicalRisk} /></td>
                  <td className="num py-2 pr-3 text-muted-foreground">{r.supplier.reliability}</td>
                  <td className="num py-2 pr-3 text-muted-foreground">{r.availableVolume.toFixed(2)}</td>
                  <td className="py-2 pr-3"><StatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel eyebrow="Signals" title="Geopolitical event stream">
        <ul className="space-y-3">
          {GEO_EVENTS.map((e) => (
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
    </AppShell>
  );
}
