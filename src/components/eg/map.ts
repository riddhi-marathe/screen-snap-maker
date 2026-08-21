// Equirectangular projection helpers for the digital-twin map.
export const MAP_W = 1000;
export const MAP_H = 520;

const LON_MIN = 8;
const LON_MAX = 108;
const LAT_MIN = -40;
const LAT_MAX = 50;

export function project(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}

export function pathFrom(points: { lat: number; lon: number }[]) {
  return points
    .map((p, i) => {
      const { x, y } = project(p.lat, p.lon);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function pointAlong(points: { lat: number; lon: number }[], t: number) {
  const pts = points.map((p) => project(p.lat, p.lon));
  if (pts.length < 2) return { x: pts[0]?.x ?? 0, y: pts[0]?.y ?? 0, angle: 0 };
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push(d);
    total += d;
  }
  let dist = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]!;
    if (dist <= seg || i === segs.length - 1) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const r = seg === 0 ? 0 : dist / seg;
      return {
        x: a.x + (b.x - a.x) * r,
        y: a.y + (b.y - a.y) * r,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    dist -= seg;
  }
  const last = pts[pts.length - 1]!;
  return { x: last.x, y: last.y, angle: 0 };
}

// Rough landmass outlines (lon/lat pairs) for orientation only.
const LAND: [number, number][][] = [
  // Africa (north-east + east coast)
  [
    [8, 34], [20, 33], [32, 31], [34, 28], [37, 22], [39, 15], [43, 12], [45, 11],
    [51, 12], [48, 5], [42, 1], [40, -5], [40, -16], [35, -24], [30, -31], [25, -34],
    [18, -34], [14, -23], [12, -6], [9, 4], [8, 12], [8, 34],
  ],
  // Arabian peninsula
  [
    [34, 30], [40, 31], [48, 30], [51, 28], [56, 26], [59, 22], [55, 18], [52, 16],
    [45, 13], [43, 13], [39, 21], [35, 28], [34, 30],
  ],
  // Iran / Turkey / Central Asia
  [
    [26, 41], [45, 42], [56, 45], [70, 45], [78, 40], [76, 36], [70, 34], [62, 30],
    [58, 26], [56, 27], [48, 30], [40, 31], [34, 36], [26, 41],
  ],
  // Indian subcontinent
  [
    [61, 26], [68, 24], [70, 22], [72, 20], [73, 16], [76, 9], [78, 8], [80, 13],
    [83, 18], [87, 21], [90, 22], [92, 21], [92, 26], [88, 27], [80, 30], [74, 33],
    [70, 28], [66, 25], [61, 26],
  ],
  // South-east Asia
  [
    [92, 21], [97, 18], [100, 14], [103, 10], [106, 9], [108, 15], [108, 22],
    [100, 22], [95, 22], [92, 21],
  ],
  // Sumatra / Malay peninsula
  [
    [95, 5], [100, 6], [104, 1], [108, -2], [104, -6], [100, -2], [95, 5],
  ],
  // Sri Lanka
  [
    [80, 9], [82, 8], [81, 6], [80, 6], [80, 9],
  ],
  // Madagascar
  [
    [43, -12], [50, -15], [48, -25], [44, -25], [43, -12],
  ],
];

export const LAND_PATHS = LAND.map((poly) =>
  poly
    .map(([lon, lat], i) => {
      const { x, y } = project(lat, lon);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z",
);
