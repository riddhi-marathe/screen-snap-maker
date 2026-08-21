import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Fuel,
  Gauge,
  LayoutDashboard,
  LineChart,
  Radar,
  Radio,
  ShieldAlert,
  Ship,
  Sparkles,
} from "lucide-react";
import { useEnergyGuard } from "@/lib/eg/store";
import { PRESET_SCENARIOS } from "@/lib/eg/engine";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Command Dashboard", icon: LayoutDashboard },
  { to: "/live", label: "Live Tracking", icon: Ship },
  { to: "/risk", label: "Risk Intelligence", icon: Radar },
  { to: "/scenarios", label: "Scenario Lab", icon: Sparkles },
  { to: "/spr", label: "SPR Optimizer", icon: Fuel },
  { to: "/forecast", label: "Supply Gap Forecast", icon: LineChart },
  { to: "/planner", label: "AI Crisis Planner", icon: ShieldAlert },
  { to: "/alerts", label: "Alerts & Feed", icon: AlertTriangle },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { user, signOut, liveMode, toggleLive, result, activePreset, applyPreset, tick } = useEnergyGuard();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (user === null) {
      const raw = typeof window !== "undefined" ? localStorage.getItem("energyguard.session") : null;
      if (!raw) navigate({ to: "/" });
    }
  }, [user, navigate]);

  const sevTone =
    result.severity === "critical"
      ? "bg-destructive/15 text-destructive border-destructive/40"
      : result.severity === "severe"
        ? "bg-warning/15 text-warning border-warning/40"
        : result.severity === "elevated"
          ? "bg-primary/15 text-primary border-primary/40"
          : "bg-success/15 text-success border-success/40";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-tight text-sidebar-foreground">ENERGYGUARD AI</p>
            <p className="label-eyebrow">Energy Security Control Tower</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === to && "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="label-eyebrow mb-2">Active scenario</p>
          <select
            value={activePreset}
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
          >
            {PRESET_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="custom">Custom configuration</option>
          </select>
          <div className={cn("mt-3 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wider", sevTone)}>
            Posture: {result.severity}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold text-foreground">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLive}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                liveMode
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Radio className="h-3.5 w-3.5" />
              {liveMode ? "LIVE FEED" : "FEED PAUSED"}
            </button>
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="num">tick {tick.toString().padStart(4, "0")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
              <div className="text-right">
                <p className="text-xs font-medium text-foreground">{user?.name ?? "Operator"}</p>
                <p className="label-eyebrow">{user?.role ?? "Analyst"}</p>
              </div>
              <button
                onClick={() => {
                  signOut();
                  navigate({ to: "/" });
                }}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Exit
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-5 p-5">{children}</main>
      </div>
    </div>
  );
}
