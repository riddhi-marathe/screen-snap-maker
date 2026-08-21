import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BASE_SCENARIO, PRESET_SCENARIOS, simulate, type ScenarioParams, type SimResult } from "./engine";
import { VESSELS } from "./data";

export type VesselState = {
  id: string;
  progress: number;
  speed: number;
  status: "underway" | "holding" | "rerouting";
};

type Ctx = {
  params: ScenarioParams;
  setParam: (k: keyof ScenarioParams, v: number) => void;
  setParams: (p: ScenarioParams) => void;
  resetParams: () => void;
  activePreset: string;
  applyPreset: (id: string) => void;
  result: SimResult;
  liveMode: boolean;
  toggleLive: () => void;
  tick: number;
  vessels: VesselState[];
  user: { name: string; role: string } | null;
  signIn: (name: string, role: string) => void;
  signOut: () => void;
};

const EnergyGuardContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "energyguard.session";

export function EnergyGuardProvider({ children }: { children: ReactNode }) {
  const [params, setParamsState] = useState<ScenarioParams>({ ...BASE_SCENARIO });
  const [activePreset, setActivePreset] = useState("baseline");
  const [liveMode, setLiveMode] = useState(true);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [vessels, setVessels] = useState<VesselState[]>(() =>
    VESSELS.map((v) => ({ id: v.id, progress: v.progress, speed: v.speed, status: "underway" as const })),
  );
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!liveMode) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      const p = paramsRef.current;
      setVessels((prev) =>
        prev.map((v, i) => {
          const source = VESSELS[i];
          const corridor = source?.routeId ?? "";
          const blocked =
            (corridor.includes("hormuz") && p.hormuzDisruption > 70) ||
            (corridor.includes("redsea") && p.redSeaDisruption > 70);
          const slow =
            (corridor.includes("hormuz") && p.hormuzDisruption > 20) ||
            (corridor.includes("redsea") && p.redSeaDisruption > 20);
          const step = blocked ? 0 : (0.006 * (slow ? 0.45 : 1) * v.speed) / 12;
          return {
            ...v,
            progress: (v.progress + step) % 1,
            status: blocked ? "holding" : slow ? "rerouting" : "underway",
          };
        }),
      );
    }, 1200);
    return () => window.clearInterval(id);
  }, [liveMode]);

  const setParam = useCallback((k: keyof ScenarioParams, v: number) => {
    setActivePreset("custom");
    setParamsState((prev) => ({ ...prev, [k]: v }));
  }, []);

  const setParams = useCallback((p: ScenarioParams) => {
    setActivePreset("custom");
    setParamsState(p);
  }, []);

  const resetParams = useCallback(() => {
    setActivePreset("baseline");
    setParamsState({ ...BASE_SCENARIO });
  }, []);

  const applyPreset = useCallback((id: string) => {
    const preset = PRESET_SCENARIOS.find((s) => s.id === id);
    if (!preset) return;
    setActivePreset(id);
    setParamsState({ ...preset.params });
  }, []);

  const signIn = useCallback((name: string, role: string) => {
    const u = { name, role };
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const result = useMemo(() => simulate(params), [params]);

  const value: Ctx = {
    params,
    setParam,
    setParams,
    resetParams,
    activePreset,
    applyPreset,
    result,
    liveMode,
    toggleLive: () => setLiveMode((v) => !v),
    tick,
    vessels,
    user,
    signIn,
    signOut,
  };

  return <EnergyGuardContext.Provider value={value}>{children}</EnergyGuardContext.Provider>;
}

export function useEnergyGuard() {
  const ctx = useContext(EnergyGuardContext);
  if (!ctx) throw new Error("useEnergyGuard must be used inside EnergyGuardProvider");
  return ctx;
}
