import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  action,
  className,
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel p-4", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="label-eyebrow">{eyebrow}</p>}
            {title && <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  unit,
  delta,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  hint?: string;
}) {
  const toneCls =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="panel p-4">
      <p className="label-eyebrow">{label}</p>
      <p className={cn("num mt-2 text-2xl font-semibold leading-none", toneCls)}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
      {delta && <p className="num mt-2 text-[11px] text-muted-foreground">{delta}</p>}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function RiskBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "var(--color-critical)"
      : value >= 60
        ? "var(--color-warning)"
        : value >= 40
          ? "var(--color-primary)"
          : "var(--color-success)";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    blocked: "bg-destructive/15 text-destructive border-destructive/40",
    reduced: "bg-warning/15 text-warning border-warning/40",
    steady: "bg-muted text-muted-foreground border-border",
    surge: "bg-success/15 text-success border-success/40",
    holding: "bg-destructive/15 text-destructive border-destructive/40",
    rerouting: "bg-warning/15 text-warning border-warning/40",
    underway: "bg-success/15 text-success border-success/40",
    critical: "bg-destructive/15 text-destructive border-destructive/40",
    high: "bg-warning/15 text-warning border-warning/40",
    medium: "bg-primary/15 text-primary border-primary/40",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        map[status] ?? map.steady,
      )}
    >
      {status}
    </span>
  );
}
