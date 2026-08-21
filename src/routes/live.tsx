import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { WorldMap } from "@/components/eg/WorldMap";
import { Kpi, Panel, StatusPill } from "@/components/eg/widgets";
import { useEnergyGuard } from "@/lib/eg/store";
import { VESSELS, SUPPLIERS, PORTS } from "@/lib/eg/data";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Tracking — EnergyGuard AI" },
      {
        name: "description",
        content: "Real-time simulated tracking of crude tankers, chokepoint transits and discharge port queues.",
      },
      { property: "og:title", content: "Live Tracking — EnergyGuard AI" },
      { property: "og:description", content: "Live tanker positions, transit status and port discharge load." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { vessels, result } = useEnergyGuard();
  const holding = vessels.filter((v) => v.status === "holding").length;
  const rerouting = vessels.filter((v) => v.status === "rerouting").length;
  const cargoAfloat = VESSELS.reduce((a, v) => a + v.cargoKbbl, 0) / 1000;

  return (
    <AppShell title="Live Tracking" subtitle="Digital twin of inbound crude tonnage and terminal load">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Vessels tracked" value={String(vessels.length)} delta="AIS-simulated" />
        <Kpi label="Holding / blocked" value={String(holding)} tone={holding ? "bad" : "good"} delta="chokepoint closure" />
        <Kpi label="Rerouting" value={String(rerouting)} tone={rerouting ? "warn" : "good"} delta="longer transit" />
        <Kpi label="Cargo afloat" value={cargoAfloat.toFixed(1)} unit="MMbbl" delta={`${result.deliverableMbd.toFixed(2)} mb/d deliverable`} />
      </div>

      <Panel eyebrow="Digital twin" title="Global maritime picture">
        <WorldMap />
      </Panel>

      <Panel eyebrow="Fleet" title="Vessel manifest">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Vessel</th>
                <th className="py-2 pr-3 font-medium">Class</th>
                <th className="py-2 pr-3 font-medium">Origin</th>
                <th className="py-2 pr-3 font-medium">Discharge</th>
                <th className="py-2 pr-3 font-medium">Cargo (kbbl)</th>
                <th className="py-2 pr-3 font-medium">Progress</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {VESSELS.map((v, i) => {
                const st = vessels[i];
                const sup = SUPPLIERS.find((s) => s.id === v.supplierId);
                const port = PORTS.find((p) => p.id === v.destPortId);
                return (
                  <tr key={v.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{v.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{v.class}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{sup?.terminal ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{port?.name ?? "—"}</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{v.cargoKbbl}</td>
                    <td className="num py-2 pr-3 text-muted-foreground">{((st?.progress ?? 0) * 100).toFixed(0)}%</td>
                    <td className="py-2 pr-3"><StatusPill status={st?.status ?? "underway"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
