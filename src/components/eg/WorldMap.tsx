import { useState } from "react";
import { CORRIDORS, PORTS, RESERVES, ROUTES, SUPPLIERS, VESSELS } from "@/lib/eg/data";
import { useEnergyGuard } from "@/lib/eg/store";
import { LAND_PATHS, MAP_H, MAP_W, pathFrom, pointAlong, project } from "./map";

type Selection =
  | { kind: "vessel"; id: string }
  | { kind: "corridor"; id: string }
  | { kind: "port"; id: string }
  | { kind: "supplier"; id: string }
  | null;

function riskColor(risk: number) {
  if (risk >= 80) return "var(--color-critical)";
  if (risk >= 60) return "var(--color-warning)";
  if (risk >= 40) return "var(--color-primary)";
  return "var(--color-success)";
}

export function WorldMap({ compact = false }: { compact?: boolean }) {
  const { result, vessels, params } = useEnergyGuard();
  const [sel, setSel] = useState<Selection>(null);

  const riskOf = (corridorId: string) =>
    result.corridorRisk.find((c) => c.id === corridorId)?.risk ?? 0;

  const selectedInfo = () => {
    if (!sel) return null;
    if (sel.kind === "vessel") {
      const v = VESSELS.find((x) => x.id === sel.id);
      const st = vessels.find((x) => x.id === sel.id);
      if (!v) return null;
      const supplier = SUPPLIERS.find((s) => s.id === v.supplierId);
      const port = PORTS.find((p) => p.id === v.destPortId);
      const route = ROUTES.find((r) => r.id === v.routeId);
      return {
        title: v.name,
        sub: `${v.class} · ${v.imo}`,
        rows: [
          ["Cargo", `${v.cargoKbbl.toLocaleString()} kbbl`],
          ["Origin", supplier ? `${supplier.terminal}, ${supplier.country}` : "—"],
          ["Destination", port ? `${port.name}, ${port.state}` : "—"],
          ["Route", route?.name ?? "—"],
          ["Speed", `${v.speed.toFixed(1)} kn`],
          ["Voyage", `${Math.round((st?.progress ?? 0) * 100)}% complete`],
          ["Status", (st?.status ?? "underway").toUpperCase()],
          ["Corridor risk", `${riskOf(route?.corridorId ?? "")}/100`],
        ] as [string, string][],
      };
    }
    if (sel.kind === "corridor") {
      const c = CORRIDORS.find((x) => x.id === sel.id);
      if (!c) return null;
      return {
        title: c.name,
        sub: `Chokepoint · ${c.short}`,
        rows: [
          ["Live risk score", `${riskOf(c.id)}/100`],
          ["Baseline risk", `${c.baseRisk}/100`],
          ["Flow to India", `${c.dailyFlowMbd.toFixed(2)} mb/d`],
          ["Transit time", `${c.transitDays} days`],
          ["Assessment", c.notes],
        ] as [string, string][],
      };
    }
    if (sel.kind === "port") {
      const p = PORTS.find((x) => x.id === sel.id);
      const r = RESERVES.find((x) => x.id === sel.id);
      if (p)
        return {
          title: p.name,
          sub: `Discharge port · ${p.state}`,
          rows: [
            ["Nameplate capacity", `${p.capacityMbd.toFixed(2)} mb/d`],
            ["Effective capacity", `${((p.capacityMbd * params.portCapacity) / 100).toFixed(2)} mb/d`],
            ["Utilisation", `${Math.min(99, Math.round(62 + params.demandIncrease))}%`],
          ] as [string, string][],
        };
      if (r)
        return {
          title: r.site,
          sub: "Strategic petroleum reserve",
          rows: [
            ["Capacity", `${r.capacityMMbbl.toFixed(1)} MMbbl`],
            ["Fill level", `${r.fillPct}%`],
            ["Max drawdown", `${r.maxDrawMbd.toFixed(2)} mb/d`],
          ] as [string, string][],
        };
      return null;
    }
    const s = SUPPLIERS.find((x) => x.id === sel.id);
    if (!s) return null;
    const plan = result.supplierPlan.find((x) => x.supplier.id === s.id);
    return {
      title: `${s.terminal}`,
      sub: `${s.country} · ${s.grade}`,
      rows: [
        ["Contracted", `${s.baseVolumeMbd.toFixed(2)} mb/d`],
        ["Recommended", `${(plan?.recommendedVolume ?? 0).toFixed(2)} mb/d`],
        ["Landed cost", `$${(plan?.landedCost ?? s.landedCost).toFixed(1)}/bbl`],
        ["API / Sulphur", `${s.api}° / ${s.sulphur}%`],
        ["Corridor", CORRIDORS.find((c) => c.id === s.corridor)?.name ?? "—"],
        ["Supplier score", `${plan?.score ?? 0}/100`],
      ] as [string, string][],
    };
  };

  const info = selectedInfo();

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-ocean scanline">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block h-auto w-full">
        <defs>
          <radialGradient id="eg-ocean" cx="50%" cy="20%" r="90%">
            <stop offset="0%" stopColor="var(--color-card)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-ocean)" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width={MAP_W} height={MAP_H} fill="url(#eg-ocean)" />

        {/* graticule */}
        <g stroke="var(--color-grid)" strokeWidth="0.5" opacity="0.4">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * MAP_W) / 10} y1={0} x2={(i * MAP_W) / 10} y2={MAP_H} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * MAP_H) / 6} x2={MAP_W} y2={(i * MAP_H) / 6} />
          ))}
        </g>

        {/* landmasses */}
        <g fill="var(--color-land)" stroke="var(--color-grid)" strokeWidth="0.8" opacity="0.95">
          {LAND_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* routes */}
        {ROUTES.map((r) => {
          const risk = riskOf(r.corridorId);
          return (
            <g key={r.id}>
              <path
                d={pathFrom(r.waypoints)}
                fill="none"
                stroke={riskColor(risk)}
                strokeWidth={2}
                strokeOpacity={0.25}
              />
              <path
                d={pathFrom(r.waypoints)}
                fill="none"
                stroke={riskColor(risk)}
                strokeWidth={1.4}
                strokeDasharray="8 10"
                style={{ animation: "eg-dash 6s linear infinite" }}
              />
            </g>
          );
        })}

        {/* corridors */}
        {CORRIDORS.map((c) => {
          const { x, y } = project(c.center.lat, c.center.lon);
          const risk = riskOf(c.id);
          return (
            <g key={c.id} className="cursor-pointer" onClick={() => setSel({ kind: "corridor", id: c.id })}>
              <circle
                cx={x}
                cy={y}
                r={12}
                fill={riskColor(risk)}
                opacity={0.22}
                style={{ animation: "eg-pulse 2.6s ease-in-out infinite", transformOrigin: `${x}px ${y}px` }}
              />
              <circle cx={x} cy={y} r={5} fill={riskColor(risk)} />
              <text
                x={x + 10}
                y={y - 8}
                fontSize="10"
                fill="var(--color-foreground)"
                className="num"
                opacity={0.85}
              >
                {c.short} {risk}
              </text>
            </g>
          );
        })}

        {/* suppliers */}
        {SUPPLIERS.filter((s) => s.coords.lon > 8 && s.coords.lon < 108).map((s) => {
          const { x, y } = project(s.coords.lat, s.coords.lon);
          return (
            <g key={s.id} className="cursor-pointer" onClick={() => setSel({ kind: "supplier", id: s.id })}>
              <rect
                x={x - 4}
                y={y - 4}
                width={8}
                height={8}
                fill="var(--color-warning)"
                opacity={0.9}
                transform={`rotate(45 ${x} ${y})`}
              />
              {!compact && (
                <text x={x + 8} y={y + 3} fontSize="8.5" fill="var(--color-muted-foreground)">
                  {s.terminal}
                </text>
              )}
            </g>
          );
        })}

        {/* ports + reserves */}
        {PORTS.map((p) => {
          const { x, y } = project(p.coords.lat, p.coords.lon);
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => setSel({ kind: "port", id: p.id })}>
              <circle cx={x} cy={y} r={4} fill="var(--color-primary)" />
              {!compact && (
                <text x={x + 7} y={y + 3} fontSize="8.5" fill="var(--color-muted-foreground)">
                  {p.name}
                </text>
              )}
            </g>
          );
        })}
        {RESERVES.map((r) => {
          const { x, y } = project(r.coords.lat, r.coords.lon);
          return (
            <g key={r.id} className="cursor-pointer" onClick={() => setSel({ kind: "port", id: r.id })}>
              <path
                d={`M${x} ${y - 5} L${x + 5} ${y + 4} L${x - 5} ${y + 4} Z`}
                fill="var(--color-success)"
                opacity={0.9}
              />
            </g>
          );
        })}

        {/* vessels */}
        {VESSELS.map((v) => {
          const route = ROUTES.find((r) => r.id === v.routeId);
          const st = vessels.find((x) => x.id === v.id);
          if (!route || !st) return null;
          const pos = pointAlong(route.waypoints, st.progress);
          const color =
            st.status === "holding"
              ? "var(--color-critical)"
              : st.status === "rerouting"
                ? "var(--color-warning)"
                : "var(--color-primary-glow)";
          return (
            <g
              key={v.id}
              className="cursor-pointer"
              onClick={() => setSel({ kind: "vessel", id: v.id })}
              transform={`translate(${pos.x} ${pos.y}) rotate(${pos.angle})`}
            >
              <path d="M-6 -3 L4 -3 L8 0 L4 3 L-6 3 Z" fill={color} stroke="var(--color-background)" strokeWidth="0.6" />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-3 rounded-md border border-border bg-background/70 px-3 py-2 backdrop-blur">
        {[
          ["Chokepoint", "var(--color-critical)"],
          ["Load terminal", "var(--color-warning)"],
          ["Discharge port", "var(--color-primary)"],
          ["SPR site", "var(--color-success)"],
          ["Vessel", "var(--color-primary-glow)"],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {info && (
        <div className="absolute bottom-3 right-3 w-72 rounded-lg border border-border bg-popover/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-semibold text-foreground">{info.title}</p>
              <p className="label-eyebrow mt-0.5">{info.sub}</p>
            </div>
            <button
              onClick={() => setSel(null)}
              className="rounded px-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <dl className="mt-3 space-y-1.5">
            {info.rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 text-xs">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="num text-right text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
