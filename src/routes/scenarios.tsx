import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eg/AppShell";
import { Kpi, Panel } from "@/components/eg/widgets";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useEnergyGuard } from "@/lib/eg/store";
import { PRESET_SCENARIOS, type ScenarioParams } from "@/lib/eg/engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Lab — EnergyGuard AI" },
      {
        name: "description",
        content: "Stress-test crude supply against chokepoint closures, embargoes, price shocks and demand spikes.",
      },
      { property: "og:title", content: "Scenario Lab — EnergyGuard AI" },
      { property: "og:description", content: "Interactive disruption simulation and stress testing." },
    ],
  }),
  component: ScenariosPage,
});

const CONTROLS: { key: keyof ScenarioParams; label: string; min: number; max: number; unit: string }[] = [
  { key: "hormuzDisruption", label: "Hormuz disruption", min: 0, max: 100, unit: "%" },
  { key: "redSeaDisruption", label: "Red Sea disruption", min: 0, max: 100, unit: "%" },
  { key: "priceShock", label: "Price shock", min: -50, max: 200, unit: "%" },
  { key: "supplierAvailability", label: "Supplier availability", min: 0, max: 100, unit: "%" },
  { key: "shippingDelay", label: "Shipping delay", min: 0, max: 30, unit: "d" },
  { key: "sprAvailability", label: "SPR availability", min: 0, max: 100, unit: "%" },
  { key: "domesticProduction", label: "Domestic production", min: 50, max: 150, unit: "%" },
  { key: "demandIncrease", label: "Demand change", min: -20, max: 50, unit: "%" },
  { key: "portCapacity", label: "Port capacity", min: 40, max: 100, unit: "%" },
  { key: "refineryAvailability", label: "Refinery availability", min: 40, max: 100, unit: "%" },
];

function ScenariosPage() {
  const { params, setParam, resetParams, applyPreset, activePreset, result } = useEnergyGuard();

  return (
    <AppShell title="Scenario Lab" subtitle="Parametric disruption modelling across the crude import chain">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Resilience index" value={result.resilienceIndex.toFixed(0)} unit="/100" tone={result.resilienceIndex > 70 ? "good" : result.resilienceIndex > 50 ? "warn" : "bad"} />
        <Kpi label="Supply gap" value={result.supplyGapMbd.toFixed(2)} unit="mb/d" tone={result.supplyGapMbd > 0.4 ? "bad" : result.supplyGapMbd > 0.05 ? "warn" : "good"} />
        <Kpi label="Brent" value={`$${result.brent.toFixed(1)}`} unit="/bbl" tone={result.brent > 100 ? "bad" : "neutral"} />
        <Kpi label="SPR runway" value={result.sprRunwayDays > 900 ? "∞" : result.sprRunwayDays.toFixed(0)} unit="days" tone={result.sprRunwayDays > 60 ? "good" : "warn"} />
      </div>

      <Panel eyebrow="Library" title="Preset crisis scenarios">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRESET_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => applyPreset(s.id)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                activePreset === s.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-foreground">{s.name}</span>
                <span className="label-eyebrow text-primary">{s.tag}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{s.summary}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        eyebrow="Controls"
        title="Scenario parameters"
        action={<Button size="sm" variant="outline" onClick={resetParams}>Reset to baseline</Button>}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {CONTROLS.map((c) => (
            <div key={c.key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-foreground">{c.label}</span>
                <span className="num text-muted-foreground">
                  {params[c.key]}
                  {c.unit}
                </span>
              </div>
              <Slider
                className="mt-2"
                min={c.min}
                max={c.max}
                step={1}
                value={[params[c.key]]}
                onValueChange={(v) => setParam(c.key, v[0] ?? 0)}
              />
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
