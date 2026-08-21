// ENERGYGUARD AI — static reference dataset (simulated intelligence baseline)

export type LatLon = { lat: number; lon: number };

export type Corridor = {
  id: string;
  name: string;
  short: string;
  baseRisk: number; // 0-100
  dailyFlowMbd: number; // million barrels/day serving India
  transitDays: number;
  center: LatLon;
  notes: string;
};

export type Supplier = {
  id: string;
  country: string;
  terminal: string;
  grade: string;
  api: number;
  sulphur: number;
  baseVolumeMbd: number;
  landedCost: number; // USD/bbl
  transitDays: number;
  corridor: string;
  reliability: number; // 0-100
  politicalRisk: number; // 0-100
  spareCapacityMbd: number;
  coords: LatLon;
};

export type Port = {
  id: string;
  name: string;
  state: string;
  capacityMbd: number;
  coords: LatLon;
};

export type Reserve = {
  id: string;
  site: string;
  capacityMMbbl: number;
  fillPct: number;
  maxDrawMbd: number;
  coords: LatLon;
};

export type Vessel = {
  id: string;
  name: string;
  imo: string;
  class: string;
  cargoKbbl: number;
  supplierId: string;
  destPortId: string;
  routeId: string;
  progress: number; // 0-1
  speed: number; // knots
};

export type RouteDef = {
  id: string;
  name: string;
  corridorId: string;
  waypoints: LatLon[];
  distanceNm: number;
  baseCostPerBbl: number;
};

export const CORRIDORS: Corridor[] = [
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    short: "HRZ",
    baseRisk: 71,
    dailyFlowMbd: 2.65,
    transitDays: 9,
    center: { lat: 26.6, lon: 56.3 },
    notes: "Single chokepoint for Gulf loadings. No practical maritime bypass.",
  },
  {
    id: "babelmandeb",
    name: "Bab-el-Mandeb / Red Sea",
    short: "BAM",
    baseRisk: 64,
    dailyFlowMbd: 0.62,
    transitDays: 14,
    center: { lat: 12.6, lon: 43.4 },
    notes: "Drone and missile threat envelope; war-risk premia elevated.",
  },
  {
    id: "suez",
    name: "Suez Canal",
    short: "SUZ",
    baseRisk: 47,
    dailyFlowMbd: 0.41,
    transitDays: 16,
    center: { lat: 30.2, lon: 32.5 },
    notes: "Transit dependent on Red Sea security; Cape reroute adds 12-15 days.",
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    short: "MLC",
    baseRisk: 33,
    dailyFlowMbd: 0.38,
    transitDays: 11,
    center: { lat: 2.6, lon: 101.2 },
    notes: "Eastbound product flows and Far East crude; congestion sensitive.",
  },
  {
    id: "capegoodhope",
    name: "Cape of Good Hope",
    short: "CGH",
    baseRisk: 18,
    dailyFlowMbd: 0.54,
    transitDays: 28,
    center: { lat: -34.4, lon: 18.5 },
    notes: "Secure but long-haul; freight and demurrage heavy.",
  },
];

export const SUPPLIERS: Supplier[] = [
  {
    id: "sa-rastanura",
    country: "Saudi Arabia",
    terminal: "Ras Tanura",
    grade: "Arab Light",
    api: 33,
    sulphur: 1.8,
    baseVolumeMbd: 0.82,
    landedCost: 84.2,
    transitDays: 9,
    corridor: "hormuz",
    reliability: 93,
    politicalRisk: 46,
    spareCapacityMbd: 0.55,
    coords: { lat: 26.64, lon: 50.16 },
  },
  {
    id: "iq-basra",
    country: "Iraq",
    terminal: "Basra Oil Terminal",
    grade: "Basra Medium",
    api: 30,
    sulphur: 2.9,
    baseVolumeMbd: 0.94,
    landedCost: 81.7,
    transitDays: 10,
    corridor: "hormuz",
    reliability: 86,
    politicalRisk: 62,
    spareCapacityMbd: 0.3,
    coords: { lat: 29.7, lon: 48.6 },
  },
  {
    id: "ae-ruwais",
    country: "UAE",
    terminal: "Ruwais / Fujairah",
    grade: "Murban",
    api: 40,
    sulphur: 0.75,
    baseVolumeMbd: 0.41,
    landedCost: 86.9,
    transitDays: 8,
    corridor: "hormuz",
    reliability: 95,
    politicalRisk: 34,
    spareCapacityMbd: 0.22,
    coords: { lat: 24.1, lon: 52.73 },
  },
  {
    id: "kw-mina",
    country: "Kuwait",
    terminal: "Mina al-Ahmadi",
    grade: "Kuwait Export",
    api: 31,
    sulphur: 2.5,
    baseVolumeMbd: 0.28,
    landedCost: 82.9,
    transitDays: 9,
    corridor: "hormuz",
    reliability: 90,
    politicalRisk: 44,
    spareCapacityMbd: 0.12,
    coords: { lat: 29.07, lon: 48.15 },
  },
  {
    id: "ru-novo",
    country: "Russia",
    terminal: "Novorossiysk / Primorsk",
    grade: "Urals",
    api: 31,
    sulphur: 1.5,
    baseVolumeMbd: 1.62,
    landedCost: 74.4,
    transitDays: 22,
    corridor: "babelmandeb",
    reliability: 79,
    politicalRisk: 71,
    spareCapacityMbd: 0.34,
    coords: { lat: 44.72, lon: 37.77 },
  },
  {
    id: "us-corpus",
    country: "United States",
    terminal: "Corpus Christi",
    grade: "WTI Midland",
    api: 42,
    sulphur: 0.4,
    baseVolumeMbd: 0.31,
    landedCost: 91.5,
    transitDays: 34,
    corridor: "capegoodhope",
    reliability: 96,
    politicalRisk: 12,
    spareCapacityMbd: 0.48,
    coords: { lat: 27.8, lon: -97.4 },
  },
  {
    id: "ng-bonny",
    country: "Nigeria",
    terminal: "Bonny",
    grade: "Bonny Light",
    api: 35,
    sulphur: 0.16,
    baseVolumeMbd: 0.19,
    landedCost: 89.1,
    transitDays: 24,
    corridor: "capegoodhope",
    reliability: 74,
    politicalRisk: 55,
    spareCapacityMbd: 0.21,
    coords: { lat: 4.42, lon: 7.18 },
  },
  {
    id: "br-tupi",
    country: "Brazil",
    terminal: "Angra / Tupi FPSO",
    grade: "Lula",
    api: 29,
    sulphur: 0.35,
    baseVolumeMbd: 0.14,
    landedCost: 88.4,
    transitDays: 31,
    corridor: "capegoodhope",
    reliability: 88,
    politicalRisk: 18,
    spareCapacityMbd: 0.26,
    coords: { lat: -23.0, lon: -44.3 },
  },
  {
    id: "ao-girassol",
    country: "Angola",
    terminal: "Girassol",
    grade: "Girassol",
    api: 31,
    sulphur: 0.32,
    baseVolumeMbd: 0.11,
    landedCost: 87.2,
    transitDays: 22,
    corridor: "capegoodhope",
    reliability: 80,
    politicalRisk: 41,
    spareCapacityMbd: 0.15,
    coords: { lat: -8.8, lon: 12.2 },
  },
  {
    id: "gy-stabroek",
    country: "Guyana",
    terminal: "Stabroek Block",
    grade: "Liza Light",
    api: 32,
    sulphur: 0.51,
    baseVolumeMbd: 0.08,
    landedCost: 90.3,
    transitDays: 30,
    corridor: "capegoodhope",
    reliability: 91,
    politicalRisk: 15,
    spareCapacityMbd: 0.19,
    coords: { lat: 7.6, lon: -57.5 },
  },
];

export const PORTS: Port[] = [
  { id: "vadinar", name: "Vadinar", state: "Gujarat", capacityMbd: 1.35, coords: { lat: 22.35, lon: 69.72 } },
  { id: "jamnagar", name: "Sikka / Jamnagar", state: "Gujarat", capacityMbd: 1.42, coords: { lat: 22.43, lon: 69.85 } },
  { id: "jnpt", name: "JNPT / Mumbai", state: "Maharashtra", capacityMbd: 0.78, coords: { lat: 18.94, lon: 72.94 } },
  { id: "kochi", name: "Kochi", state: "Kerala", capacityMbd: 0.42, coords: { lat: 9.93, lon: 76.26 } },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", capacityMbd: 0.31, coords: { lat: 13.1, lon: 80.3 } },
  { id: "paradip", name: "Paradip", state: "Odisha", capacityMbd: 0.61, coords: { lat: 20.26, lon: 86.67 } },
];

export const RESERVES: Reserve[] = [
  { id: "vizag", site: "Visakhapatnam", capacityMMbbl: 9.8, fillPct: 96, maxDrawMbd: 0.18, coords: { lat: 17.69, lon: 83.22 } },
  { id: "mangalore", site: "Mangaluru", capacityMMbbl: 11.0, fillPct: 91, maxDrawMbd: 0.21, coords: { lat: 12.91, lon: 74.86 } },
  { id: "padur", site: "Padur", capacityMMbbl: 17.4, fillPct: 88, maxDrawMbd: 0.29, coords: { lat: 13.42, lon: 74.72 } },
  { id: "chandikhol", site: "Chandikhol (Ph-II)", capacityMMbbl: 29.3, fillPct: 41, maxDrawMbd: 0.24, coords: { lat: 20.7, lon: 86.1 } },
];

export const REFINERIES = [
  { id: "jamnagar-r", name: "Jamnagar", operator: "Private", capacityMbd: 1.24, complexity: 21.1, minApi: 18 },
  { id: "vadinar-r", name: "Vadinar", operator: "Private", capacityMbd: 0.4, complexity: 11.8, minApi: 20 },
  { id: "panipat-r", name: "Panipat", operator: "PSU", capacityMbd: 0.3, complexity: 9.4, minApi: 24 },
  { id: "paradip-r", name: "Paradip", operator: "PSU", capacityMbd: 0.31, complexity: 12.2, minApi: 18 },
  { id: "mumbai-r", name: "Mumbai (BPCL)", operator: "PSU", capacityMbd: 0.24, complexity: 8.9, minApi: 26 },
  { id: "kochi-r", name: "Kochi", operator: "PSU", capacityMbd: 0.31, complexity: 10.5, minApi: 22 },
];

export const ROUTES: RouteDef[] = [
  {
    id: "gulf-hormuz-west",
    name: "Gulf → Hormuz → Vadinar",
    corridorId: "hormuz",
    distanceNm: 1620,
    baseCostPerBbl: 1.9,
    waypoints: [
      { lat: 27.4, lon: 49.6 },
      { lat: 26.9, lon: 53.4 },
      { lat: 26.5, lon: 56.4 },
      { lat: 24.6, lon: 59.8 },
      { lat: 22.9, lon: 65.4 },
      { lat: 22.35, lon: 69.72 },
    ],
  },
  {
    id: "basra-hormuz-jnpt",
    name: "Basra → Hormuz → JNPT",
    corridorId: "hormuz",
    distanceNm: 1980,
    baseCostPerBbl: 2.2,
    waypoints: [
      { lat: 29.5, lon: 48.7 },
      { lat: 27.2, lon: 52.1 },
      { lat: 26.5, lon: 56.4 },
      { lat: 23.6, lon: 61.2 },
      { lat: 20.4, lon: 68.1 },
      { lat: 18.94, lon: 72.94 },
    ],
  },
  {
    id: "redsea-suez-kochi",
    name: "Suez → Bab-el-Mandeb → Kochi",
    corridorId: "babelmandeb",
    distanceNm: 3450,
    baseCostPerBbl: 3.4,
    waypoints: [
      { lat: 30.2, lon: 32.5 },
      { lat: 22.0, lon: 37.6 },
      { lat: 15.4, lon: 41.6 },
      { lat: 12.6, lon: 43.4 },
      { lat: 12.4, lon: 51.8 },
      { lat: 11.2, lon: 62.4 },
      { lat: 9.93, lon: 76.26 },
    ],
  },
  {
    id: "cape-paradip",
    name: "Atlantic Basin → Cape → Paradip",
    corridorId: "capegoodhope",
    distanceNm: 8900,
    baseCostPerBbl: 6.1,
    waypoints: [
      { lat: -20.6, lon: 12.4 },
      { lat: -34.4, lon: 18.5 },
      { lat: -30.2, lon: 34.6 },
      { lat: -14.4, lon: 52.4 },
      { lat: 2.4, lon: 68.2 },
      { lat: 8.2, lon: 79.4 },
      { lat: 20.26, lon: 86.67 },
    ],
  },
  {
    id: "malacca-chennai",
    name: "Far East → Malacca → Chennai",
    corridorId: "malacca",
    distanceNm: 2450,
    baseCostPerBbl: 2.8,
    waypoints: [
      { lat: 1.3, lon: 103.8 },
      { lat: 2.6, lon: 101.2 },
      { lat: 5.4, lon: 96.4 },
      { lat: 8.2, lon: 88.4 },
      { lat: 13.1, lon: 80.3 },
    ],
  },
];

const VESSEL_NAMES = [
  "MT Desh Shakti",
  "MT Swarna Kamal",
  "VLCC Arabian Dawn",
  "MT Gulf Sentinel",
  "VLCC Ural Star",
  "MT Bharat Jyoti",
  "Suezmax Aden Pearl",
  "VLCC Cape Meridian",
  "MT Malacca Trader",
  "VLCC Basra Falcon",
  "MT Fujairah Spirit",
  "VLCC Deccan Voyager",
];

export const VESSELS: Vessel[] = VESSEL_NAMES.map((name, i) => {
  const route = ROUTES[i % ROUTES.length]!;
  const supplierPool = SUPPLIERS.filter((s) => s.corridor === route.corridorId);
  const supplier = supplierPool[i % Math.max(1, supplierPool.length)] ?? SUPPLIERS[0]!;
  const port = PORTS[i % PORTS.length]!;
  return {
    id: `v-${i + 1}`,
    name,
    imo: `IMO ${9200000 + i * 1373}`,
    class: i % 3 === 0 ? "VLCC" : i % 3 === 1 ? "Suezmax" : "Aframax",
    cargoKbbl: i % 3 === 0 ? 2000 : i % 3 === 1 ? 1000 : 750,
    supplierId: supplier.id,
    destPortId: port.id,
    routeId: route.id,
    progress: ((i * 137) % 100) / 100,
    speed: 11.2 + ((i * 7) % 5) * 0.6,
  };
});

export const GEO_EVENTS = [
  {
    id: "e1",
    time: "T-02:14",
    severity: "critical" as const,
    corridor: "hormuz",
    headline: "Naval escort tempo raised in inner Gulf after two tanker approach incidents",
    source: "Maritime Security Wire",
    riskDelta: +9,
  },
  {
    id: "e2",
    time: "T-04:38",
    severity: "high" as const,
    corridor: "babelmandeb",
    headline: "War-risk insurance premia for Red Sea transits up 38 bps week-on-week",
    source: "Underwriting Digest",
    riskDelta: +6,
  },
  {
    id: "e3",
    time: "T-06:02",
    severity: "medium" as const,
    corridor: "suez",
    headline: "Canal authority reports southbound convoy delays averaging 11 hours",
    source: "Canal Ops Bulletin",
    riskDelta: +3,
  },
  {
    id: "e4",
    time: "T-09:51",
    severity: "high" as const,
    corridor: "hormuz",
    headline: "New secondary sanctions listing touches two loading terminals",
    source: "Sanctions Monitor",
    riskDelta: +5,
  },
  {
    id: "e5",
    time: "T-13:20",
    severity: "low" as const,
    corridor: "malacca",
    headline: "Congestion easing at eastbound anchorage; waiting time down to 9 hours",
    source: "Port Ops Feed",
    riskDelta: -2,
  },
  {
    id: "e6",
    time: "T-18:44",
    severity: "medium" as const,
    corridor: "capegoodhope",
    headline: "Southern Ocean weather routing adds 1.4 days on Atlantic Basin voyages",
    source: "Met Routing",
    riskDelta: +2,
  },
];

// National baseline (simulated)
export const BASELINE = {
  demandMbd: 5.42,
  domesticProductionMbd: 0.58,
  importsMbd: 4.84,
  brent: 84.6,
  sprTotalMMbbl: RESERVES.reduce((a, r) => a + (r.capacityMMbbl * r.fillPct) / 100, 0),
  sprCapacityMMbbl: RESERVES.reduce((a, r) => a + r.capacityMMbbl, 0),
};
