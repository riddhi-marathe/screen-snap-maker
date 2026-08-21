import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { RESERVES } from "@/lib/eg/data";

export const Route = createFileRoute("/spr")({
  head: () => ({
    meta: [
      { title: "SPR Optimizer — EnergyGuard AI" },
      {
        name: "description",
        content: "Strategic petroleum reserve drawdown pacing, site-level allocation and runway under active scenario.",
      },
      { property: "og:title", content: "SPR Optimizer — EnergyGuard AI" },
      { property: "og:description", content: "Optimal reserve drawdown pacing and runway analysis." },
    ],
  }),
  component: SprPage,
});

function SprPage() {
  const { result, params } = useEnergyGuard();
  const totalDraw = RESERVES.reduce((a, r) => a + r.maxDrawMbd, 0);

  return (
    <AppShell title="SPR Optimizer" subtitle="Strategic reserve drawdown allocation and endurance planning">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Usable reserve" value={result.sprUsableMMbbl.toFixed(1)} unit="MMbbl" delta={`${params.sprAvailability}% accessible`} />
        <Kpi label="Recommended drawdown" value={result.drawdownMbd.toFixed(2)} unit="mb/d" tone={result.drawdownMbd > 0 ? "warn" : "good"} />
        <Kpi label="Runway" value={result.sprRunwayDays > 900 ? "∞" : result.sprRunwayDays.toFixed(0)} unit="days" tone={result.sprRunwayDays > 60 ? "good" : result.sprRunwayDays > 25 ? "warn" : "bad"} />
        <Kpi label="Residual gap" value={result.netGapMbd.toFixed(2)} unit="mb/d" tone={result.netGapMbd > 0.05 ? "bad" : "good"} delta="after drawdown" />
      </div>

      <Panel eyebrow="Allocation" title="Site-level drawdown plan">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Site</th>
                <th className="py-2 pr-3 font-medium">Capacity (MMbbl)</th>
                <th className="py-2 pr-3 font-medium">Fill</th>
                <th className="py-2 pr-3 font-medium">Max draw (mb/d)</th>
                <th className="py-2 pr-3 font-medium">Allocated (mb/d)</th>
                <th className="py-2 pr-3 font-medium">Site runway (d)</th>
              </tr>
            </thead>
            <tbody>
              {RESERVES.map((r) => {
                const share = totalDraw > 0 ? r.maxDrawMbd / totalDraw : 0;
                const alloc = result.drawdownMbd * share;
                const usable = (r.capacityMMbbl * r.fillPct) / 100 * (params.sprAvailability / 100);
                const days = alloc > 0.001 ? usable / alloc : Infinity;
                return (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{r.site}</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{r.capacityMMbbl.toFixed(1)}</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{r.fillPct}%</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{r.maxDrawMbd.toFixed(2)}</td>
                    <td className="num py-2 pr-3 text-primary">{alloc.toFixed(3)}</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{Number.isFinite(days) ? days.toFixed(0) : "∞"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Allocation is pro-rata to certified maximum withdrawal rate; runway assumes constant drawdown with no refill.
        </p>
      </Panel>

      <Panel eyebrow="Logistics" title="Reroute & substitution options">
        <ul className="space-y-3">
          {result.reroutes.length === 0 && (
            <li className="text-xs text-muted-foreground">No reroute required under the active scenario.</li>
          )}
          {result.reroutes.map((r, i) => (
            <li key={i} className="rounded-md border border-border bg-background/40 p-3">
              <p className="text-xs text-foreground">{r.from} → {r.to}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                +{r.addedDays}d · +${r.addedCost.toFixed(2)}/bbl · {r.volumeMbd.toFixed(2)} mb/d · feasibility {r.feasibility}%
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
