// ENERGYGUARD AI — deterministic disruption simulation & optimisation engine.
import {
  BASELINE,
  CORRIDORS,
  RESERVES,
  SUPPLIERS,
  type Supplier,
} from "./data";

export type ScenarioParams = {
  hormuzDisruption: number; // 0-100 % throughput lost
  redSeaDisruption: number; // 0-100
  priceShock: number; // -50..200 % on brent
  supplierAvailability: number; // 0-100 % of contracted supply available
  shippingDelay: number; // 0-30 extra days
  sprAvailability: number; // 0-100 % of SPR usable
  domesticProduction: number; // 50-150 % of baseline
  demandIncrease: number; // -20..50 %
  portCapacity: number; // 40-100 %
  refineryAvailability: number; // 40-100 %
};

export const BASE_SCENARIO: ScenarioParams = {
  hormuzDisruption: 0,
  redSeaDisruption: 0,
  priceShock: 0,
  supplierAvailability: 100,
  shippingDelay: 0,
  sprAvailability: 100,
  domesticProduction: 100,
  demandIncrease: 0,
  portCapacity: 100,
  refineryAvailability: 100,
};

export type SimResult = {
  demandMbd: number;
  domesticMbd: number;
  requiredImportsMbd: number;
  availableImportsMbd: number;
  deliverableMbd: number;
  supplyGapMbd: number;
  gapPct: number;
  brent: number;
  landedCost: number;
  corridorRisk: { id: string; name: string; short: string; risk: number; flow: number }[];
  avgCorridorRisk: number;
  resilienceIndex: number;
  sprUsableMMbbl: number;
  sprRunwayDays: number;
  drawdownMbd: number;
  netGapMbd: number;
  severity: "stable" | "elevated" | "severe" | "critical";
  economicImpactCrPerDay: number;
  supplierPlan: SupplierPlanRow[];
  forecast: ForecastPoint[];
  reroutes: RerouteRow[];
};

export type SupplierPlanRow = {
  supplier: Supplier;
  baseVolume: number;
  availableVolume: number;
  recommendedVolume: number;
  deltaVolume: number;
  landedCost: number;
  score: number;
  status: "blocked" | "reduced" | "steady" | "surge";
};

export type ForecastPoint = {
  day: number;
  label: string;
  demand: number;
  supply: number;
  withSpr: number;
  gap: number;
  price: number;
};

export type RerouteRow = {
  from: string;
  to: string;
  addedDays: number;
  addedCost: number;
  volumeMbd: number;
  feasibility: number;
};

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

export function corridorRiskFor(id: string, p: ScenarioParams): number {
  const c = CORRIDORS.find((x) => x.id === id);
  if (!c) return 0;
  let r = c.baseRisk;
  if (id === "hormuz") r += p.hormuzDisruption * 0.29;
  if (id === "babelmandeb") r += p.redSeaDisruption * 0.33;
  if (id === "suez") r += p.redSeaDisruption * 0.26;
  if (id === "malacca") r += p.redSeaDisruption * 0.05 + p.hormuzDisruption * 0.03;
  if (id === "capegoodhope") r += p.hormuzDisruption * 0.06 + p.shippingDelay * 0.4;
  r += (100 - p.portCapacity) * 0.08;
  r += p.shippingDelay * 0.35;
  return clamp(Math.round(r));
}

function supplierAvailability(s: Supplier, p: ScenarioParams): number {
  let factor = p.supplierAvailability / 100;
  if (s.corridor === "hormuz") factor *= 1 - p.hormuzDisruption / 100;
  if (s.corridor === "babelmandeb") factor *= 1 - p.redSeaDisruption / 100;
  if (s.corridor === "suez") factor *= 1 - (p.redSeaDisruption * 0.85) / 100;
  factor *= 0.55 + (s.reliability / 100) * 0.45;
  return Math.max(0, s.baseVolumeMbd * factor);
}

function supplierScore(s: Supplier, p: ScenarioParams): number {
  const risk = corridorRiskFor(s.corridor, p);
  const costScore = clamp(100 - (s.landedCost - 70) * 3.2);
  const speedScore = clamp(100 - s.transitDays * 2.4);
  const routeScore = 100 - risk;
  const geoScore = 100 - s.politicalRisk;
  return Math.round(
    costScore * 0.24 + speedScore * 0.16 + routeScore * 0.3 + geoScore * 0.16 + s.reliability * 0.14,
  );
}

export function simulate(p: ScenarioParams): SimResult {
  const demandMbd = BASELINE.demandMbd * (1 + p.demandIncrease / 100);
  const domesticMbd = BASELINE.domesticProductionMbd * (p.domesticProduction / 100);
  const requiredImportsMbd = Math.max(0, demandMbd - domesticMbd);

  const rows: SupplierPlanRow[] = SUPPLIERS.map((s) => {
    const availableVolume = supplierAvailability(s, p);
    return {
      supplier: s,
      baseVolume: s.baseVolumeMbd,
      availableVolume,
      recommendedVolume: availableVolume,
      deltaVolume: 0,
      landedCost: s.landedCost,
      score: supplierScore(s, p),
      status: "steady",
    };
  });

  let availableImportsMbd = rows.reduce((a, r) => a + r.availableVolume, 0);
  let shortfall = requiredImportsMbd - availableImportsMbd;

  // Greedy reallocation onto highest-scoring suppliers with spare capacity.
  if (shortfall > 0) {
    const ranked = [...rows].sort((a, b) => b.score - a.score);
    for (const r of ranked) {
      if (shortfall <= 0) break;
      const headroom = r.supplier.spareCapacityMbd * (p.supplierAvailability / 100) *
        (r.supplier.corridor === "hormuz" ? 1 - p.hormuzDisruption / 100 : 1) *
        (r.supplier.corridor === "babelmandeb" ? 1 - p.redSeaDisruption / 100 : 1);
      const add = Math.min(headroom, shortfall);
      r.recommendedVolume += add;
      shortfall -= add;
    }
  }

  for (const r of rows) {
    r.deltaVolume = r.recommendedVolume - r.baseVolume;
    r.status =
      r.recommendedVolume < 0.02
        ? "blocked"
        : r.deltaVolume > 0.02
          ? "surge"
          : r.deltaVolume < -0.02
            ? "reduced"
            : "steady";
    // Crisis reroute / long-haul premium on landed cost.
    const risk = corridorRiskFor(r.supplier.corridor, p);
    r.landedCost =
      r.supplier.landedCost * (1 + p.priceShock / 100) +
      risk * 0.06 +
      p.shippingDelay * 0.22 +
      (r.deltaVolume > 0 ? 1.8 : 0);
  }

  availableImportsMbd = rows.reduce((a, r) => a + r.recommendedVolume, 0);

  // Logistics throughput ceilings.
  const logisticsFactor = Math.min(p.portCapacity / 100, p.refineryAvailability / 100);
  const delayFactor = Math.max(0.6, 1 - p.shippingDelay * 0.012);
  const deliverableMbd = availableImportsMbd * logisticsFactor * delayFactor;

  const supplyGapMbd = Math.max(0, requiredImportsMbd - deliverableMbd);
  const gapPct = requiredImportsMbd > 0 ? (supplyGapMbd / requiredImportsMbd) * 100 : 0;

  const corridorRisk = CORRIDORS.map((c) => ({
    id: c.id,
    name: c.name,
    short: c.short,
    risk: corridorRiskFor(c.id, p),
    flow: c.dailyFlowMbd,
  }));
  const totalFlow = corridorRisk.reduce((a, c) => a + c.flow, 0);
  const avgCorridorRisk = Math.round(
    corridorRisk.reduce((a, c) => a + c.risk * c.flow, 0) / (totalFlow || 1),
  );

  const sprUsableMMbbl = RESERVES.reduce(
    (a, r) => a + ((r.capacityMMbbl * r.fillPct) / 100) * (p.sprAvailability / 100),
    0,
  );
  const maxDrawMbd = RESERVES.reduce((a, r) => a + r.maxDrawMbd, 0) * (p.sprAvailability / 100);
  const drawdownMbd = Math.min(maxDrawMbd, supplyGapMbd);
  const netGapMbd = Math.max(0, supplyGapMbd - drawdownMbd);
  const sprRunwayDays = drawdownMbd > 0.001 ? sprUsableMMbbl / drawdownMbd : 999;

  const brent = BASELINE.brent * (1 + p.priceShock / 100) + gapPct * 0.42 + avgCorridorRisk * 0.08;
  const weightedCost =
    rows.reduce((a, r) => a + r.landedCost * r.recommendedVolume, 0) /
    (rows.reduce((a, r) => a + r.recommendedVolume, 0) || 1);

  const resilienceIndex = clamp(
    Math.round(
      100 -
        gapPct * 1.25 -
        avgCorridorRisk * 0.38 -
        Math.max(0, 60 - Math.min(sprRunwayDays, 60)) * 0.35 -
        Math.max(0, p.priceShock) * 0.1,
    ),
  );

  const severity: SimResult["severity"] =
    resilienceIndex >= 72
      ? "stable"
      : resilienceIndex >= 52
        ? "elevated"
        : resilienceIndex >= 32
          ? "severe"
          : "critical";

  // ~1 Cr = 10 million INR; 83 INR/USD
  const economicImpactCrPerDay = Math.round(
    ((netGapMbd * 1_000_000 * brent + deliverableMbd * 1_000_000 * (weightedCost - BASELINE.brent)) *
      83) /
      10_000_000,
  );

  const forecast: ForecastPoint[] = [];
  let sprLeft = sprUsableMMbbl;
  for (let d = 0; d <= 90; d += 3) {
    const ramp = Math.min(1, d / 12);
    const mitigation = Math.min(0.42, d / 90 * 0.42); // procurement adaptation over time
    const dayGap = supplyGapMbd * ramp * (1 - mitigation);
    const draw = Math.min(maxDrawMbd, dayGap);
    sprLeft = Math.max(0, sprLeft - draw * 3);
    const effectiveDraw = sprLeft > 0 ? draw : 0;
    forecast.push({
      day: d,
      label: `D+${d}`,
      demand: +demandMbd.toFixed(2),
      supply: +(demandMbd - dayGap).toFixed(2),
      withSpr: +(demandMbd - dayGap + effectiveDraw).toFixed(2),
      gap: +Math.max(0, dayGap - effectiveDraw).toFixed(2),
      price: +(BASELINE.brent * (1 + p.priceShock / 100) + dayGap * 22 * (1 - mitigation)).toFixed(1),
    });
  }

  const reroutes: RerouteRow[] = [];
  if (p.hormuzDisruption > 0) {
    reroutes.push({
      from: "Gulf → Hormuz → West Coast",
      to: "Gulf → East-West pipeline → Yanbu → Cape/Red Sea",
      addedDays: 6 + Math.round(p.redSeaDisruption / 20),
      addedCost: 2.4 + p.hormuzDisruption * 0.022,
      volumeMbd: +(2.65 * (p.hormuzDisruption / 100) * 0.42).toFixed(2),
      feasibility: clamp(78 - p.redSeaDisruption * 0.4),
    });
    reroutes.push({
      from: "Gulf barrels (unliftable)",
      to: "Atlantic Basin (US / Brazil / Guyana) via Cape",
      addedDays: 19,
      addedCost: 5.6,
      volumeMbd: +(2.65 * (p.hormuzDisruption / 100) * 0.33).toFixed(2),
      feasibility: clamp(84 - p.shippingDelay * 1.4),
    });
  }
  if (p.redSeaDisruption > 0) {
    reroutes.push({
      from: "Suez / Bab-el-Mandeb transit",
      to: "Cape of Good Hope long-haul",
      addedDays: 13,
      addedCost: 3.9,
      volumeMbd: +(1.03 * (p.redSeaDisruption / 100)).toFixed(2),
      feasibility: clamp(90 - p.shippingDelay * 1.1),
    });
  }
  if (p.hormuzDisruption > 40) {
    reroutes.push({
      from: "West coast discharge (Vadinar/Sikka)",
      to: "East coast discharge (Paradip/Chennai) + inland pipeline",
      addedDays: 4,
      addedCost: 1.7,
      volumeMbd: +(0.5 * (p.hormuzDisruption / 100)).toFixed(2),
      feasibility: clamp(p.portCapacity - 8),
    });
  }

  return {
    demandMbd,
    domesticMbd,
    requiredImportsMbd,
    availableImportsMbd,
    deliverableMbd,
    supplyGapMbd,
    gapPct,
    brent,
    landedCost: weightedCost,
    corridorRisk,
    avgCorridorRisk,
    resilienceIndex,
    sprUsableMMbbl,
    sprRunwayDays,
    drawdownMbd,
    netGapMbd,
    severity,
    economicImpactCrPerDay,
    supplierPlan: rows.sort((a, b) => b.recommendedVolume - a.recommendedVolume),
    forecast,
    reroutes,
  };
}

export type PresetScenario = {
  id: string;
  name: string;
  tag: string;
  summary: string;
  params: ScenarioParams;
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "baseline",
    name: "Baseline Operations",
    tag: "NOMINAL",
    summary: "Steady-state flows with standing geopolitical background risk.",
    params: { ...BASE_SCENARIO },
  },
  {
    id: "hormuz",
    name: "Strait of Hormuz Total Blockade",
    tag: "SEVERE",
    summary:
      "Complete closure of Hormuz removes Gulf liftings. Tests reserve drawdown, Atlantic substitution and rationing thresholds.",
    params: {
      ...BASE_SCENARIO,
      hormuzDisruption: 100,
      priceShock: 62,
      shippingDelay: 9,
      demandIncrease: 3,
      portCapacity: 88,
    },
  },
  {
    id: "redsea",
    name: "Red Sea / Bab-el-Mandeb Threat",
    tag: "HIGH",
    summary:
      "Sustained missile and drone threat forces Cape rerouting for Suez-bound and Russian-origin cargoes.",
    params: {
      ...BASE_SCENARIO,
      redSeaDisruption: 85,
      priceShock: 18,
      shippingDelay: 13,
      supplierAvailability: 92,
    },
  },
  {
    id: "embargo",
    name: "Major Supplier Embargo",
    tag: "HIGH",
    summary:
      "Sanctions and payment-channel failure remove a top-two supplier; crude-slate compatibility becomes binding.",
    params: {
      ...BASE_SCENARIO,
      supplierAvailability: 62,
      priceShock: 27,
      refineryAvailability: 88,
      shippingDelay: 5,
    },
  },
  {
    id: "spr",
    name: "SPR Optimisation Drill",
    tag: "DRILL",
    summary:
      "Moderate gap with constrained reserve access — evaluates optimal drawdown pacing versus refill economics.",
    params: {
      ...BASE_SCENARIO,
      hormuzDisruption: 35,
      sprAvailability: 70,
      demandIncrease: 6,
      priceShock: 14,
    },
  },
  {
    id: "compound",
    name: "Compound Stress Test",
    tag: "CRITICAL",
    summary:
      "Simultaneous chokepoint closure, embargo, refinery outage and demand spike — the worst credible case.",
    params: {
      hormuzDisruption: 80,
      redSeaDisruption: 70,
      priceShock: 95,
      supplierAvailability: 65,
      shippingDelay: 16,
      sprAvailability: 75,
      domesticProduction: 92,
      demandIncrease: 12,
      portCapacity: 74,
      refineryAvailability: 78,
    },
  },
];

export type PlaybookAction = {
  horizon: "0-24h" | "24-72h" | "1-2 weeks" | "1-3 months";
  owner: string;
  action: string;
  impact: string;
  confidence: number;
};

export function buildPlaybook(p: ScenarioParams, r: SimResult): PlaybookAction[] {
  const out: PlaybookAction[] = [];
  if (r.supplyGapMbd > 0.05) {
    out.push({
      horizon: "0-24h",
      owner: "MoPNG Crisis Cell",
      action: `Authorise strategic reserve drawdown of ${r.drawdownMbd.toFixed(2)} mb/d across Padur, Mangaluru and Visakhapatnam.`,
      impact: `Covers ${((r.drawdownMbd / Math.max(r.supplyGapMbd, 0.001)) * 100).toFixed(0)}% of the gap for ${Math.min(r.sprRunwayDays, 999).toFixed(0)} days.`,
      confidence: 92,
    });
  }
  if (p.hormuzDisruption > 30) {
    out.push({
      horizon: "0-24h",
      owner: "Fleet Operations",
      action: "Hold all inbound VLCCs west of 58°E and re-berth Gulf liftings to Red Sea terminals via East-West pipeline.",
      impact: `Protects ${(2.65 * (p.hormuzDisruption / 100) * 0.42).toFixed(2)} mb/d of exposed cargo.`,
      confidence: 78,
    });
  }
  if (p.redSeaDisruption > 40) {
    out.push({
      horizon: "24-72h",
      owner: "Chartering Desk",
      action: "Switch Suez transits to Cape of Good Hope routing and lock in tonnage before freight repricing.",
      impact: "Adds ~13 transit days, avoids war-risk premium escalation of $3.9/bbl.",
      confidence: 85,
    });
  }
  const surge = r.supplierPlan.filter((s) => s.status === "surge").slice(0, 3);
  if (surge.length) {
    out.push({
      horizon: "24-72h",
      owner: "Procurement",
      action: `Trigger spot tenders with ${surge.map((s) => `${s.supplier.country} (${s.supplier.grade})`).join(", ")}.`,
      impact: `Secures ${surge.reduce((a, s) => a + s.deltaVolume, 0).toFixed(2)} mb/d of substitute barrels.`,
      confidence: 81,
    });
  }
  if (p.refineryAvailability < 95 || p.portCapacity < 95) {
    out.push({
      horizon: "1-2 weeks",
      owner: "Refinery Coordination",
      action: "Rebalance crude slate toward high-complexity units (Jamnagar, Paradip) able to run heavier substitute grades.",
      impact: "Preserves distillate yield within 2% of plan despite grade switching.",
      confidence: 74,
    });
  }
  if (r.netGapMbd > 0.15) {
    out.push({
      horizon: "1-2 weeks",
      owner: "Cabinet Secretariat",
      action: `Stage demand-moderation measures for a residual gap of ${r.netGapMbd.toFixed(2)} mb/d (priority allocation to defence, agriculture, public transport).`,
      impact: `Avoids uncontrolled shortage worth ₹${r.economicImpactCrPerDay.toLocaleString("en-IN")} Cr/day.`,
      confidence: 69,
    });
  }
  out.push({
    horizon: "1-3 months",
    owner: "Strategic Planning",
    action: "Accelerate Chandikhol Phase-II fill and expand term contracts with Atlantic Basin suppliers to structurally cut chokepoint exposure.",
    impact: "Raises resilience index by an estimated 9-14 points at steady state.",
    confidence: 71,
  });
  return out;
}
