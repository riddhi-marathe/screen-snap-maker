import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel, StatusPill } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { buildPlaybook } from "@/lib/eg/engine";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Crisis Planner — EnergyGuard AI" },
      {
        name: "description",
        content: "Agentic crisis playbook: sequenced actions, owners, impact estimates and procurement substitution plan.",
      },
      { property: "og:title", content: "AI Crisis Planner — EnergyGuard AI" },
      { property: "og:description", content: "Sequenced agentic response playbook for the active scenario." },
    ],
  }),
  component: PlannerPage,
});

const HORIZONS = ["0-24h", "24-72h", "1-2 weeks", "1-3 months"] as const;

function PlannerPage() {
  const { params, result } = useEnergyGuard();
  const playbook = buildPlaybook(params, result);

  return (
    <AppShell title="AI Crisis Planner" subtitle="Agentic response playbook generated from the active scenario">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Actions generated" value={String(playbook.length)} delta={`posture: ${result.severity}`} />
        <Kpi label="Gap to close" value={result.netGapMbd.toFixed(2)} unit="mb/d" tone={result.netGapMbd > 0.05 ? "bad" : "good"} />
        <Kpi label="Reserve lever" value={result.drawdownMbd.toFixed(2)} unit="mb/d" tone="warn" />
        <Kpi label="Avg confidence" value={playbook.length ? (playbook.reduce((a, p) => a + p.confidence, 0) / playbook.length).toFixed(0) : "—"} unit="%" />
      </div>

      {HORIZONS.map((h) => {
        const items = playbook.filter((p) => p.horizon === h);
        if (!items.length) return null;
        return (
          <Panel key={h} eyebrow={h} title={`Actions — ${h}`}>
            <ol className="space-y-3">
              {items.map((a, i) => (
                <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="label-eyebrow">{a.owner}</span>
                    <span className="num text-[10px] text-primary">{a.confidence}% confidence</span>
                  </div>
                  <p className="mt-1.5 text-xs text-foreground">{a.action}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.impact}</p>
                </li>
              ))}
            </ol>
          </Panel>
        );
      })}

      <Panel eyebrow="Procurement" title="Substitution plan">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Supplier</th>
                <th className="py-2 pr-3 font-medium">Grade</th>
                <th className="py-2 pr-3 font-medium">Base</th>
                <th className="py-2 pr-3 font-medium">Recommended</th>
                <th className="py-2 pr-3 font-medium">Δ mb/d</th>
                <th className="py-2 pr-3 font-medium">Landed $/bbl</th>
                <th className="py-2 pr-3 font-medium">Score</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.supplierPlan.map((r) => (
                <tr key={r.supplier.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 text-foreground">{r.supplier.country}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.supplier.grade}</td>
                  <td className="num py-2 pr-3 text-muted-foreground">{r.baseVolume.toFixed(2)}</td>
                  <td className="num py-2 pr-3 text-foreground">{r.recommendedVolume.toFixed(2)}</td>
                  <td className={`num py-2 pr-3 ${r.deltaVolume > 0 ? "text-success" : r.deltaVolume < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {r.deltaVolume > 0 ? "+" : ""}
                    {r.deltaVolume.toFixed(2)}
                  </td>
                  <td className="num py-2 pr-3 text-muted-foreground">{r.landedCost.toFixed(1)}</td>
                  <td className="num py-2 pr-3 text-muted-foreground">{r.score}</td>
                  <td className="py-2 pr-3"><StatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
