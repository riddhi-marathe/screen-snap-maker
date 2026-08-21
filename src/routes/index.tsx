import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Gauge, Lock, ShieldCheck, Waves } from "lucide-react";
import { useEnergyGuard } from "@/lib/eg/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyGuard AI — Energy Supply Chain Resilience Command" },
      {
        name: "description",
        content:
          "AI-driven energy supply chain resilience platform: chokepoint risk intelligence, disruption simulation, SPR optimisation and crisis-response planning for import-dependent economies.",
      },
      { property: "og:title", content: "EnergyGuard AI — Energy Security Control Tower" },
      {
        property: "og:description",
        content:
          "Monitor maritime corridors, simulate disruptions, optimise strategic reserves and generate executable crisis playbooks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ROLES = [
  { id: "Crisis Director", desc: "Full command authority, drawdown approval" },
  { id: "Risk Analyst", desc: "Corridor intelligence and scenario modelling" },
  { id: "Procurement Lead", desc: "Supplier substitution and tender execution" },
  { id: "Observer", desc: "Read-only situational awareness" },
];

function LoginPage() {
  const { signIn } = useEnergyGuard();
  const navigate = useNavigate();
  const [name, setName] = useState("R. Marathe");
  const [role, setRole] = useState(ROLES[0]!.id);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-base font-bold tracking-tight">ENERGYGUARD AI</p>
            <p className="label-eyebrow">National Energy Security Control Tower</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            AI-driven energy supply chain resilience for import-dependent economies
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Continuous monitoring of geopolitical and logistics risk across the Strait of Hormuz, Bab-el-Mandeb,
            Suez and Malacca. Disruption simulation, supply-gap prediction, strategic reserve optimisation and
            executable crisis response — in one control tower.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["5", "chokepoints monitored"],
              ["10", "supply sources modelled"],
              ["6", "crisis scenarios"],
            ].map(([n, l]) => (
              <div key={l} className="panel p-3">
                <p className="num text-2xl font-semibold text-primary">{n}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" /> Simulated intelligence environment
          </span>
          <span className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" /> Demo live mode enabled
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn(name.trim() || "Operator", role);
            navigate({ to: "/dashboard" });
          }}
          className="panel w-full max-w-md p-7"
        >
          <p className="label-eyebrow">Secure access</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Operator sign-in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select an operating role to enter the control tower. This is a demonstration environment with simulated
            data.
          </p>

          <label className="mt-6 block">
            <span className="label-eyebrow">Operator name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              placeholder="Enter name"
            />
          </label>

          <div className="mt-5 space-y-2">
            <span className="label-eyebrow">Role</span>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  role === r.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-ring/60"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{r.id}</span>
                  <span className="block text-xs text-muted-foreground">{r.desc}</span>
                </span>
                {role === r.id && <Lock className="mt-0.5 h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enter Control Tower
          </button>
        </form>
      </div>
    </div>
  );
}
