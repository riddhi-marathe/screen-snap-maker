import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel, StatusPill } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { GEO_EVENTS } from "@/lib/eg/data";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Feed — EnergyGuard AI" },
      {
        name: "description",
        content: "Threshold breaches, chokepoint alarms and the consolidated geopolitical intelligence feed.",
      },
      { property: "og:title", content: "Alerts & Feed — EnergyGuard AI" },
      { property: "og:description", content: "Live threshold alarms and intelligence feed." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { result, params } = useEnergyGuard();

  const alerts: { severity: string; title: string; detail: string }[] = [];
  if (result.supplyGapMbd > 0.05)
    alerts.push({
      severity: result.supplyGapMbd > 0.4 ? "critical" : "high",
      title: `Import shortfall of ${result.supplyGapMbd.toFixed(2)} mb/d`,
      detail: `${result.gapPct.toFixed(1)}% of required imports unmet before reserve drawdown.`,
    });
  if (result.sprRunwayDays < 45)
    alerts.push({
      severity: result.sprRunwayDays < 20 ? "critical" : "high",
      title: `Reserve runway down to ${result.sprRunwayDays.toFixed(0)} days`,
      detail: `${result.sprUsableMMbbl.toFixed(1)} MMbbl usable at ${result.drawdownMbd.toFixed(2)} mb/d drawdown.`,
    });
  for (const c of result.corridorRisk) {
    if (c.risk >= 70)
      alerts.push({
        severity: c.risk >= 85 ? "critical" : "high",
        title: `${c.name} risk at ${c.risk}/100`,
        detail: `${c.flow.toFixed(2)} mb/d of Indian-bound flow exposed on this corridor.`,
      });
  }
  if (params.refineryAvailability < 90)
    alerts.push({
      severity: "moderate",
      title: `Refinery availability at ${params.refineryAvailability}%`,
      detail: "Processing ceiling constrains deliverable barrels regardless of cargo arrivals.",
    });
  if (params.portCapacity < 90)
    alerts.push({
      severity: "moderate",
      title: `Port capacity at ${params.portCapacity}%`,
      detail: "Discharge queues will lengthen; consider east-coast re-berthing.",
    });
  if (!alerts.length)
    alerts.push({ severity: "low", title: "No threshold breaches", detail: "All indicators within nominal operating bands." });

  return (
    <AppShell title="Alerts & Feed" subtitle="Threshold breaches and consolidated intelligence stream">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active alerts" value={String(alerts.length)} tone={alerts.length > 3 ? "bad" : alerts.length > 1 ? "warn" : "good"} />
        <Kpi label="Posture" value={result.severity.toUpperCase()} tone={result.severity === "stable" ? "good" : result.severity === "critical" ? "bad" : "warn"} />
        <Kpi label="Avg corridor risk" value={result.avgCorridorRisk.toFixed(0)} unit="/100" tone={result.avgCorridorRisk > 65 ? "bad" : "warn"} />
        <Kpi label="Impact" value={`₹${result.economicImpactCrPerDay.toFixed(0)}`} unit="cr/day" tone={result.economicImpactCrPerDay > 0 ? "bad" : "good"} />
      </div>

      <Panel eyebrow="Thresholds" title="Active alarms">
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <li key={i} className="rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <StatusPill status={a.severity} />
              </div>
              <p className="mt-1.5 text-xs text-foreground">{a.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{a.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel eyebrow="Signals" title="Intelligence feed">
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
