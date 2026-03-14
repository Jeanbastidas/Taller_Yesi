import { useState, useMemo, useEffect, useContext, Suspense } from "react";
import { UnitContext } from "../context/UnitContext";
import { getConv, getUnits } from "../utils/units";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { InlineMath } from "react-katex";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Play,
  RotateCcw,
  Info,
  Activity,
  Droplets,
  FlaskConical,
  Download,
  Layers,
  Save,
  Box,
  MessageCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { Lab3DContainer } from "./Lab3DContainer";
import { AIAssistant, downloadCSV } from "./AIAssistant";

const FLUID_PRESETS = [
  {
    name: "Agua",
    mu: 0.001002,
    rho: 998,
    color: "text-blue-500",
    hex: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  {
    name: "Aceite Motor",
    mu: 0.29,
    rho: 890,
    color: "text-amber-600",
    hex: "#d97706",
    bg: "rgba(217, 119, 6, 0.1)",
  },
  {
    name: "Glicerina",
    mu: 1.412,
    rho: 1260,
    color: "text-emerald-500",
    hex: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  {
    name: "Miel",
    mu: 10.0,
    rho: 1420,
    color: "text-orange-600",
    hex: "#ea580c",
    bg: "rgba(234, 88, 12, 0.1)",
  },
  {
    name: "Mercurio",
    mu: 0.00155,
    rho: 13546,
    color: "text-slate-500",
    hex: "#64748b",
    bg: "rgba(100, 116, 139, 0.2)",
  },
  {
    name: "Sangre",
    mu: 0.0035,
    rho: 1060,
    color: "text-red-600",
    hex: "#dc2626",
    bg: "rgba(220, 38, 38, 0.1)",
  },
];

export const VirtualLabs = () => {
  const { unitSystem } = useContext(UnitContext);

  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    );
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Conversion Helpers (SI to USCS)
  const conv = useMemo(() => getConv(unitSystem), [unitSystem]);
  const units = useMemo(() => getUnits(unitSystem), [unitSystem]);
  const stokesNoiseParticles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 0.7 + Math.random() * 0.7,
        delay: Math.random() * 0.5,
        drift: 3 + Math.random() * 4,
      })),
    [],
  );
  // Comparison State
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  // 3D View toggles
  const [stokes3D, setStokes3D] = useState(true);
  const [couette3D, setCouette3D] = useState(true);

  // Selected Fluid Indices
  const [pFluidIdx, setPFluidIdx] = useState(0);
  const [sFluidIdx, setSFluidIdx] = useState(0);
  const [cFluidIdx, setCFluidIdx] = useState(0);

  // Global Temperature
  const [temperature, setTemperature] = useState(20); // °C

  // Non-Newtonian State
  const [isNonNewtonian, setIsNonNewtonian] = useState(false);
  const [flowIndex, setFlowIndex] = useState(0.8); // n < 1: Pseudoplastic, n > 1: Dilatant

  // Helper to adjust viscosity based on temperature (Andrade's Equation simplified)
  const getAdjustedMu = (baseMu: number, temp: number) => {
    // Reference temp is 20°C. Viscosity decreases as temp increases.
    const deltaT = temp - 20;
    return baseMu * Math.exp(-0.03 * deltaT);
  };

  // Lab 1: Poiseuille Profile
  const [pParams, setPParams] = useState(() => {
    const saved = localStorage.getItem("pParams");
    return saved ? JSON.parse(saved) : { r: 0.05, mu: 0.001002, dp: 500, l: 2 };
  });

  useEffect(() => {
    localStorage.setItem("pParams", JSON.stringify(pParams));
  }, [pParams]);

  const currentPMu = useMemo(
    () => getAdjustedMu(pParams.mu, temperature),
    [pParams.mu, temperature],
  );

  const profileData = useMemo(() => {
    const data = [];
    const steps = 20;
    const mu = currentPMu;

    if (isNonNewtonian) {
      // Power Law: u(r) = (dp/(2KL))^(1/n) * (n/(n+1)) * [R^((n+1)/n) - r^((n+1)/n)]
      // K is consistency index, we'll approximate K ~ mu for simplicity in this lab
      const K = mu;
      const n = flowIndex;
      const factor =
        Math.pow(pParams.dp / (2 * K * pParams.l), 1 / n) * (n / (n + 1));

      for (let i = -steps; i <= steps; i++) {
        const r = (i / steps) * pParams.r;
        const absR = Math.abs(r);
        const u =
          factor *
          (Math.pow(pParams.r, (n + 1) / n) - Math.pow(absR, (n + 1) / n));
        data.push({ r: r.toFixed(3), u: Number(u.toFixed(4)) });
      }
    } else {
      const uMax = (pParams.dp * Math.pow(pParams.r, 2)) / (4 * mu * pParams.l);
      for (let i = -steps; i <= steps; i++) {
        const r = (i / steps) * pParams.r;
        const u = uMax * (1 - Math.pow(r / pParams.r, 2));
        data.push({ r: r.toFixed(3), u: Number(u.toFixed(4)) });
      }
    }
    return data;
  }, [pParams, currentPMu, isNonNewtonian, flowIndex]);

  const qValue = useMemo(() => {
    const mu = currentPMu;
    if (isNonNewtonian) {
      const K = mu;
      const n = flowIndex;
      return (
        ((Math.PI * n) / (3 * n + 1)) *
        Math.pow(pParams.dp / (2 * K * pParams.l), 1 / n) *
        Math.pow(pParams.r, (3 * n + 1) / n)
      );
    }
    return (
      (Math.PI * Math.pow(pParams.r, 4) * pParams.dp) / (8 * mu * pParams.l)
    );
  }, [pParams, currentPMu, isNonNewtonian, flowIndex]);

  // Lab 2: Stokes Sedimentation
  const [sParams, setSParams] = useState(() => {
    const saved = localStorage.getItem("sParams");
    return saved
      ? JSON.parse(saved)
      : { radius: 0.002, mu: 1.0, rhoP: 2500, rhoF: 1000, h: 1 };
  });

  useEffect(() => {
    localStorage.setItem("sParams", JSON.stringify(sParams));
  }, [sParams]);

  const [stokesPlayback, setStokesPlayback] = useState(() => {
    const saved = localStorage.getItem("stokesPlayback");
    return saved ? Number(saved) : 3;
  });

  useEffect(() => {
    localStorage.setItem("stokesPlayback", String(stokesPlayback));
  }, [stokesPlayback]);

  const currentSMu = useMemo(
    () => getAdjustedMu(sParams.mu, temperature),
    [sParams.mu, temperature],
  );

  const [stokesProgress, setStokesProgress] = useState(0);
  const [isStokesRunning, setIsStokesRunning] = useState(false);

  const g = 9.81;
  const vt =
    (2 * Math.pow(sParams.radius, 2) * (sParams.rhoP - sParams.rhoF) * g) /
    (9 * currentSMu);
  const physicalTime = sParams.h / vt;
  const playbackTime = useMemo(() => {
    const speed = Number.isFinite(stokesPlayback) ? stokesPlayback : 3;
    const t = physicalTime / Math.max(0.5, speed);
    // Keep the animation readable even when vt is extremely small/large.
    return Math.min(12, Math.max(2.5, t));
  }, [physicalTime, stokesPlayback]);
  const rep = (sParams.rhoF * vt * (2 * sParams.radius)) / currentSMu;

  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;

    const animate = () => {
      const now = performance.now();
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(100, (elapsed / playbackTime) * 100);

      setStokesProgress(progress);

      if (progress < 100 && isStokesRunning) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setIsStokesRunning(false);
      }
    };

    if (isStokesRunning) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isStokesRunning, playbackTime]);

  const resetStokes = () => {
    setStokesProgress(0);
    setIsStokesRunning(false);
  };

  // Lab 3: Couette Flow
  const [cParams, setCParams] = useState(() => {
    const saved = localStorage.getItem("cParams");
    return saved ? JSON.parse(saved) : { h: 0.05, uTop: 1.0 };
  });

  useEffect(() => {
    localStorage.setItem("cParams", JSON.stringify(cParams));
  }, [cParams]);
  const couetteData = useMemo(() => {
    const data = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * cParams.h;
      const u = cParams.uTop * (y / cParams.h);
      data.push({ y: y.toFixed(3), u: Number(u.toFixed(4)) });
    }
    return data;
  }, [cParams]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 2,
      })),
    [],
  );

  const saveForComparison = (labId: string, data: any) => {
    setComparisonData((prev) => {
      const filtered = prev.filter((item) => item.labId !== labId);
      return [...filtered, { ...data, labId, timestamp: Date.now() }];
    });
  };

  // Challenges State
  const [activeChallenge, setActiveChallenge] = useState<number | null>(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  const challenges = [
    {
      id: 1,
      title: "Caudal Crítico",
      desc: "Ajusta los parámetros para obtener un caudal (Q) entre 0.00005 y 0.00006 m³/s en el Lab 01.",
      check: () => qValue >= 0.00005 && qValue <= 0.00006,
    },
    {
      id: 2,
      title: "Sedimentación Lenta",
      desc: "Logra que la partícula tarde más de 10 segundos en caer en el Lab 02.",
      check: () => physicalTime > 10,
    },
    {
      id: 3,
      title: "Fluido Adelgazante",
      desc: "Activa el modo No-Newtoniano y ajusta 'n' para que el perfil sea más plano (n < 0.5).",
      check: () => isNonNewtonian && flowIndex < 0.5,
    },
  ];

  useEffect(() => {
    if (activeChallenge !== null) {
      const challenge = challenges.find((c) => c.id === activeChallenge);
      if (challenge?.check()) {
        setChallengeSuccess(true);
        setTimeout(() => setChallengeSuccess(false), 3000);
      }
    }
  }, [qValue, physicalTime, isNonNewtonian, flowIndex, activeChallenge]);

  return (
    <div className="min-h-screen bg-brand-bg text-slate-200 font-sans selection:bg-brand-accent/30">
      {/* Header & Global Controls */}
      <header className="p-6 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent/10 rounded-lg">
              <FlaskConical className="text-brand-accent" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VirtualLabs{" "}
                <span className="text-brand-accent">FluidDynamics</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                Simulador de Mecánica de Fluidos v2.5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-brand-secondary/20 p-2 rounded-2xl border border-brand-border">
            <div className="flex items-center gap-3 px-4">
              <Settings size={14} className="text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Temperatura Global
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-24 h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  />
                  <span className="text-xs font-mono text-brand-accent">
                    {conv.T(temperature).toFixed(1)}
                    {units.T}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-brand-border"></div>

            <div className="flex items-center gap-3 px-4">
              <Layers size={14} className="text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Tipo de Fluido
                </span>
                <button
                  onClick={() => setIsNonNewtonian(!isNonNewtonian)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${isNonNewtonian ? "bg-brand-accent text-brand-bg" : "bg-[var(--glass-bg)] text-[var(--color-text-muted)] border border-brand-border"}`}
                >
                  {isNonNewtonian ? "NO-NEWTONIANO" : "NEWTONIANO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-6 space-y-12">
        {/* Challenges Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {challenges.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChallenge(c.id)}
              className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                activeChallenge === c.id
                  ? "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent"
                  : "border-brand-border bg-brand-secondary/10 hover:border-slate-600"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  {c.title}
                </h3>
                {activeChallenge === c.id && challengeSuccess && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-brand-accent text-brand-bg text-[8px] px-2 py-0.5 rounded-full font-bold"
                  >
                    LOGRADO!
                  </motion.div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {c.desc}
              </p>
            </button>
          ))}
        </section>

        <section id="labs" className="space-y-24">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent border border-brand-accent/30">
                <span className="font-black text-xs">P4</span>
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-200">
                Punto 4: Laboratorios{" "}
                <span className="text-brand-accent">Virtuales</span>
              </h2>
            </div>
            <p className="text-slate-400 max-w-2xl">
              Entornos de simulación interactiva para validar leyes
              fundamentales de la mecánica de fluidos en tiempo real.
            </p>
          </div>

          {/* Lab Poiseuille */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl overflow-hidden border-brand-border/50"
          >
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Activity className="text-brand-secondary" size={20} />
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                  Lab 01: Perfil de Velocidad de Poiseuille
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("fluidlab:assistant", {
                        detail: { open: true, context: "poiseuille" },
                      }),
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text)] hover:bg-white/10 transition-colors"
                  title="Abrir asistente (Lab 01)"
                  aria-label="Abrir asistente (Lab 01)"
                >
                  <MessageCircle size={16} />
                </button>
                <div className="px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-[10px] font-bold uppercase tracking-widest border border-brand-secondary/20">
                  Simulación Estacionaria
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 p-8 space-y-8 border-r border-brand-border">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Settings size={14} />
                    Parámetros de Control
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {FLUID_PRESETS.map((fluid, idx) => (
                      <button
                        key={fluid.name}
                        onClick={() => {
                          setPParams({ ...pParams, mu: fluid.mu });
                          setPFluidIdx(idx);
                        }}
                        className={`px-2 py-2 rounded-lg border text-[9px] font-bold transition-all ${
                          pFluidIdx === idx
                            ? "bg-brand-accent border-brand-accent text-brand-bg"
                            : "bg-[var(--glass-bg)] border-brand-border text-[var(--color-text-muted)] hover:border-brand-accent/50"
                        }`}
                      >
                        {fluid.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Radio del Tubo (R)
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.L(pParams.r).toFixed(2)} {units.L}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.2"
                        step="0.01"
                        value={pParams.r}
                        onChange={(e) =>
                          setPParams({ ...pParams, r: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Viscosidad Base ($\mu_0$)
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.M(pParams.mu).toFixed(4)} {units.M}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="0.5"
                        step="0.001"
                        value={pParams.mu}
                        onChange={(e) =>
                          setPParams({ ...pParams, mu: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 italic">
                        <span>
                          <InlineMath math="\mu_{adj}" />:{" "}
                          {conv.M(currentPMu).toFixed(5)} {units.M}
                        </span>
                        <span>
                          Ref: {conv.T(20).toFixed(0)}
                          {units.T}
                        </span>
                      </div>
                    </div>

                    {isNonNewtonian && (
                      <div className="space-y-3 p-4 bg-brand-accent/5 rounded-xl border border-brand-accent/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-brand-accent font-bold">
                            Índice de Flujo (n)
                          </span>
                          <span className="text-brand-accent font-mono">
                            {flowIndex}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.1"
                          value={flowIndex}
                          onChange={(e) => setFlowIndex(Number(e.target.value))}
                          className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                        />
                        <p className="text-[9px] text-slate-500">
                          {flowIndex < 1
                            ? "Pseudoplástico (Adelgazante)"
                            : flowIndex > 1
                              ? "Dilatante (Espesante)"
                              : "Newtoniano"}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Gradiente de Presión (ΔP)
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.P(pParams.dp).toFixed(2)} {units.P}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="2000"
                        step="10"
                        value={pParams.dp}
                        onChange={(e) =>
                          setPParams({ ...pParams, dp: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-brand-accent/5 rounded-2xl border border-brand-accent/20 neon-glow">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-accent uppercase tracking-[0.2em] mb-2">
                    <Droplets size={12} />
                    Caudal Resultante (Q)
                  </div>
                  <p className="text-3xl font-mono font-bold text-brand-accent tracking-tighter">
                    {conv.Q(qValue).toExponential(3)}{" "}
                    <span className="text-sm font-light opacity-60">
                      {units.Q}
                    </span>
                  </p>
                  {isNonNewtonian && (
                    <p className="text-[9px] text-brand-accent/60 mt-1">
                      Modelo: Ley de Potencia
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      saveForComparison("lab1", {
                        params: pParams,
                        result: qValue,
                        data: profileData,
                      })
                    }
                    className="flex-1 py-3 bg-white/5 border border-brand-border text-[var(--color-text)] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Save size={14} />
                    Comparar
                  </button>
                  <button
                    onClick={() =>
                      downloadCSV(
                        "Poiseuille",
                        profileData.map((d) => ({ r_m: d.r, u_ms: d.u })),
                      )
                    }
                    className="flex-1 py-3 border border-brand-accent/50 text-brand-accent rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent/5 transition-colors"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 p-8 bg-black/20">
                <div className="h-[450px] w-full relative">
                  <div className="absolute top-0 left-0 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    Visualización de Perfil Laminar
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    key={`poiseuille-${pParams.r}-${pParams.mu}-${pParams.dp}`}
                  >
                    <AreaChart
                      data={profileData}
                      layout="vertical"
                      margin={{ top: 40, right: 40, left: 40, bottom: 40 }}
                    >
                      <defs>
                        {FLUID_PRESETS.map((fluid, idx) => (
                          <linearGradient
                            key={idx}
                            id={`colorU-${idx}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="5%"
                              stopColor={fluid.hex}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={fluid.hex}
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2d2d35"
                        vertical={false}
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="r"
                        type="number"
                        domain={[pParams.r * -1, pParams.r]}
                        stroke="#475569"
                        fontSize={10}
                        tickFormatter={(val) =>
                          `${conv.L(val).toFixed(2)}${units.L}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#16161a",
                          border: "1px solid #2d2d35",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#00ff9d" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="u"
                        stroke={FLUID_PRESETS[pFluidIdx].hex}
                        strokeWidth={3}
                        fill={`url(#colorU-${pFluidIdx})`}
                        isAnimationActive={true}
                        animationDuration={1000}
                      />
                      {comparisonData.find((c) => c.labId === "lab1") && (
                        <Area
                          type="monotone"
                          data={
                            comparisonData.find((c) => c.labId === "lab1").data
                          }
                          dataKey="u"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fill="transparent"
                          isAnimationActive={false}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 right-0 p-4 glass-card rounded-xl text-[10px] font-mono text-slate-500">
                    Fluido:{" "}
                    <span className={FLUID_PRESETS[pFluidIdx].color}>
                      {FLUID_PRESETS[pFluidIdx].name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lab Stokes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl overflow-hidden border-brand-border/50"
          >
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <RotateCcw className="text-brand-accent" size={20} />
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                  Lab 02: Sedimentación de Partícula (Stokes)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("fluidlab:assistant", {
                        detail: { open: true, context: "stokes" },
                      }),
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text)] hover:bg-white/10 transition-colors"
                  title="Abrir asistente (Lab 02)"
                  aria-label="Abrir asistente (Lab 02)"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  onClick={() => setStokes3D((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    stokes3D
                      ? "bg-brand-accent border-brand-accent text-brand-bg"
                      : "bg-[var(--glass-bg)] border-brand-border text-[var(--color-text-muted)] hover:border-brand-accent/40"
                  }`}
                  title="Alternar Vista 3D"
                >
                  <Box size={14} />
                  {stokes3D ? "VISTA 3D" : "VISTA 2D"}
                </button>
                <div className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-widest border border-brand-accent/20">
                  Simulación Dinámica
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 p-8 space-y-8 border-r border-brand-border">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Settings size={14} />
                    Propiedades Físicas
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {FLUID_PRESETS.map((fluid, idx) => (
                      <button
                        key={fluid.name}
                        onClick={() => {
                          setSParams({
                            ...sParams,
                            mu: fluid.mu,
                            rhoF: fluid.rho,
                          });
                          setSFluidIdx(idx);
                          resetStokes();
                        }}
                        className={`px-2 py-2 rounded-lg border text-[9px] font-bold transition-all ${
                          sFluidIdx === idx
                            ? "bg-brand-accent border-brand-accent text-brand-bg"
                            : "bg-[var(--glass-bg)] border-brand-border text-[var(--color-text-muted)] hover:border-brand-accent/50"
                        }`}
                      >
                        {fluid.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Radio de la Esfera
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.L(sParams.radius).toFixed(4)} {units.L}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0001"
                        max="0.01"
                        step="0.0001"
                        value={sParams.radius}
                        onChange={(e) => {
                          setSParams({
                            ...sParams,
                            radius: Number(e.target.value),
                          });
                          resetStokes();
                        }}
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Viscosidad del Medio
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.M(sParams.mu).toFixed(4)} {units.M}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="5"
                        step="0.01"
                        value={sParams.mu}
                        onChange={(e) => {
                          setSParams({
                            ...sParams,
                            mu: Number(e.target.value),
                          });
                          resetStokes();
                        }}
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Velocidad de reproducción
                        </span>
                        <span className="text-brand-accent font-mono">
                          {stokesPlayback.toFixed(0)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={stokesPlayback}
                        onChange={(e) =>
                          setStokesPlayback(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Afecta solo la animación. Los resultados se calculan con
                        el modelo físico.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 glass-card rounded-xl border-brand-border/30">
                    <p className="text-xl font-mono text-[var(--color-text)]">
                      {conv.V(vt).toFixed(4)}{" "}
                      <span className="text-xs opacity-50">{units.V}</span>
                    </p>
                  </div>
                  <div className="p-4 glass-card rounded-xl border-brand-border/30">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold tracking-widest mb-1">
                      Tiempo Estimado ({conv.L(1).toFixed(0)}
                      {units.L})
                    </p>
                    <p className="text-xl font-mono text-[var(--color-text)]">
                      {physicalTime.toFixed(2)}{" "}
                      <span className="text-xs opacity-50">s</span>
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl border ${rep < 1 ? "bg-brand-accent/10 border-brand-accent/30" : "bg-red-500/10 border-red-500/30"}`}
                  >
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold tracking-widest mb-1">
                      Régimen de Stokes (Re_s &lt; 1)
                    </p>
                    <p
                      className={`text-sm font-bold ${rep < 1 ? "text-brand-accent" : "text-red-400"}`}
                    >
                      {rep < 1 ? "VÁLIDO" : "NO VÁLIDO"} (Re_s ={" "}
                      {rep.toFixed(3)})
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsStokesRunning(true)}
                    disabled={isStokesRunning || stokesProgress >= 100}
                    className="flex-1 py-3 bg-brand-accent text-brand-bg font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <Play size={18} fill="currentColor" />
                    Iniciar
                  </button>
                  <button
                    onClick={() =>
                      saveForComparison("lab2", { params: sParams, vt })
                    }
                    className="p-3 glass-card rounded-xl hover:bg-white/10 transition-colors"
                    title="Guardar para Comparar"
                    aria-label="Guardar para comparar"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={resetStokes}
                    className="p-3 glass-card rounded-xl hover:bg-white/10 transition-colors"
                    aria-label="Reiniciar simulación"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 p-8 bg-black/10 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10"></div>

                {/* -- Vista 3D -- */}
                <div
                  className={`w-full h-[460px] relative ${stokes3D ? "" : "hidden"}`}
                >
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                        Cargando 3D...
                      </div>
                    }
                  >
                    <Lab3DContainer
                      mode="stokes"
                      className="h-full"
                      stokesProps={{
                        progress: stokesProgress,
                        radius: sParams.radius,
                        fluidColor: FLUID_PRESETS[sFluidIdx].hex,
                        particleColor: "#94a3b8",
                        isRunning: isStokesRunning,
                      }}
                    />
                  </Suspense>
                </div>

                {/* -- Vista 2D -- */}
                <div
                  className={`flex flex-col md:flex-row gap-12 items-center w-full max-w-4xl relative z-10 ${stokes3D ? "hidden" : ""}`}
                >
                  {/* Simulation Container */}
                  <div className="flex gap-8">
                    <div className="relative w-32 h-[400px] border-x border-brand-border bg-brand-secondary/5 rounded-b-xl shadow-inner overflow-hidden">
                      <div className="absolute -top-6 left-0 w-full text-center text-[8px] font-bold text-[var(--color-text-muted)] uppercase">
                        Actual
                      </div>
                      {/* Fluid background based on selected fluid */}
                      <div
                        className="absolute inset-0 transition-colors duration-500"
                        style={{ backgroundColor: FLUID_PRESETS[sFluidIdx].bg }}
                      ></div>

                      {/* Streamlines / Wake Effect */}
                      <AnimatePresence>
                        {isStokesRunning && stokesProgress < 100 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            className="absolute w-full pointer-events-none"
                            style={{ top: `${stokesProgress}%` }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 border-t border-brand-accent/30 rounded-full blur-sm"></div>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-12 h-20 border-x border-brand-accent/10 rounded-full blur-md"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Depth Markers */}
                      {[0, 0.25, 0.5, 0.75, 1].map((m) => (
                        <div
                          key={m}
                          className="absolute w-full border-t border-brand-border flex items-center justify-end pr-2"
                          style={{ top: `${m * 100}%` }}
                        >
                          <span className="text-[8px] font-mono text-[var(--color-text-muted)]">
                            {(m * sParams.h).toFixed(2)}m
                          </span>
                        </div>
                      ))}

                      {/* Falling Particle */}
                      <motion.div
                        style={{
                          top: `${stokesProgress}%`,
                          width: `${Math.max(12, sParams.radius * 4000)}px`,
                          height: `${Math.max(12, sParams.radius * 4000)}px`,
                          marginTop: `-${Math.max(6, sParams.radius * 2000)}px`,
                          background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${FLUID_PRESETS[sFluidIdx].hex} 60%, #000000 100%)`,
                        }}
                        className="absolute left-1/2 -translate-x-1/2 rounded-full shadow-xl shadow-black/20 z-30 flex items-center justify-center"
                      >
                        {/* Dynamic Label */}
                        {isStokesRunning &&
                          stokesProgress > 5 &&
                          stokesProgress < 95 && (
                            <div className="absolute left-full ml-4 px-2 py-1 glass-card rounded-md shadow-sm whitespace-nowrap pointer-events-none border border-brand-border/60">
                              <p className="text-[8px] font-bold text-[var(--color-text)]">
                                y:{" "}
                                {conv
                                  .L((stokesProgress / 100) * sParams.h)
                                  .toFixed(2)}
                                {units.L}
                              </p>
                              <p className="text-[8px] font-mono text-brand-accent">
                                v: {conv.V(vt).toFixed(3)}
                                {units.V}
                              </p>
                            </div>
                          )}
                      </motion.div>

                      {/* Impact Effect */}
                      <AnimatePresence>
                        {stokesProgress >= 99 && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-brand-accent/20 rounded-[100%] blur-md"
                          />
                        )}
                      </AnimatePresence>

                      {/* Suspended Particles (subtle, stable) */}
                      <div className="absolute inset-0 pointer-events-none">
                        {stokesNoiseParticles.map((p) => (
                          <motion.div
                            key={p.id}
                            animate={
                              reduceMotion
                                ? { opacity: 0.12 }
                                : {
                                    y: isStokesRunning ? [0, -p.drift, 0] : 0,
                                    opacity: isStokesRunning
                                      ? [0.06, 0.16, 0.06]
                                      : 0.1,
                                  }
                            }
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : {
                                    duration: p.duration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: p.delay,
                                  }
                            }
                            className="absolute rounded-full bg-brand-accent/25"
                            style={{
                              width: `${p.size}px`,
                              height: `${p.size}px`,
                              left: `${p.left}%`,
                              top: `${p.top}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {comparisonData.find((c) => c.labId === "lab2") && (
                      <div className="relative w-32 h-[400px] border-x border-brand-border bg-white/5 rounded-b-xl shadow-inner opacity-60">
                        <div className="absolute -top-6 left-0 w-full text-center text-[8px] font-bold text-[var(--color-text-muted)] uppercase">
                          Comparación
                        </div>
                        <div className="absolute inset-0 bg-black/5"></div>

                        {/* Falling Particle (Comparison) */}
                        <motion.div
                          animate={{
                            top: isStokesRunning
                              ? `${Math.min(100, (stokesProgress * comparisonData.find((c) => c.labId === "lab2").vt) / vt)}%`
                              : "0%",
                          }}
                          style={{
                            width: `${Math.max(8, comparisonData.find((c) => c.labId === "lab2").params.radius * 4000)}px`,
                            height: `${Math.max(8, comparisonData.find((c) => c.labId === "lab2").params.radius * 4000)}px`,
                            marginTop: `-${Math.max(4, comparisonData.find((c) => c.labId === "lab2").params.radius * 2000)}px`,
                          }}
                          className="absolute left-1/2 -translate-x-1/2 bg-slate-500/80 rounded-full shadow-lg border-2 border-white/30"
                        />
                      </div>
                    )}
                  </div>

                  {/* Real-time Graph */}
                  <div className="flex-1 h-[300px] glass-card p-6 rounded-2xl border-brand-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                        Gráfica de Posición vs Tiempo
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                        <span className="text-[8px] text-[var(--color-text-muted)] uppercase">
                          Posición (y)
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={Array.from({ length: 30 }).map((_, i, arr) => {
                          const t =
                            (physicalTime * i) / Math.max(1, arr.length - 1);
                          return {
                            t: Number(t.toFixed(2)),
                            y: Math.min(1, (vt * t) / sParams.h),
                          };
                        })}
                      >
                        <defs>
                          <linearGradient
                            id="colorPos"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={FLUID_PRESETS[sFluidIdx].hex}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={FLUID_PRESETS[sFluidIdx].hex}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis hide />
                        <YAxis domain={[0, 1]} hide />
                        <Area
                          type="monotone"
                          dataKey="y"
                          stroke={FLUID_PRESETS[sFluidIdx].hex}
                          fillOpacity={1}
                          fill="url(#colorPos)"
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className={`absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-slate-400 font-mono ${stokes3D ? "hidden" : ""}`}
                >
                  <Info size={12} />
                  SIMULACIÓN EN TIEMPO REAL (v = {conv.V(vt).toFixed(4)}{" "}
                  {units.V})
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lab Couette */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl overflow-hidden border-brand-border/50"
          >
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Activity className="text-brand-accent" size={20} />
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  Lab 03: Flujo de Couette (Placas Paralelas)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("fluidlab:assistant", {
                        detail: { open: true, context: "couette" },
                      }),
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text)] hover:bg-white/10 transition-colors"
                  title="Abrir asistente (Lab 03)"
                  aria-label="Abrir asistente (Lab 03)"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  onClick={() => setCouette3D((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    couette3D
                      ? "bg-brand-accent border-brand-accent text-brand-bg"
                      : "bg-[var(--glass-bg)] border-brand-border text-[var(--color-text-muted)] hover:border-brand-accent/40"
                  }`}
                >
                  <Box size={14} />
                  {couette3D ? "VISTA 3D" : "VISTA 2D"}
                </button>
                <div className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-widest border border-brand-accent/20">
                  Perfil Lineal
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 p-8 space-y-8 border-r border-brand-border">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Settings size={14} />
                    Control de Placas
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {FLUID_PRESETS.map((fluid, idx) => (
                      <button
                        key={fluid.name}
                        onClick={() => setCFluidIdx(idx)}
                        className={`px-2 py-2 rounded-lg border text-[9px] font-bold transition-all ${
                          cFluidIdx === idx
                            ? "bg-brand-accent border-brand-accent text-brand-bg"
                            : "bg-[var(--glass-bg)] border-brand-border text-[var(--color-text-muted)] hover:border-brand-accent/50"
                        }`}
                      >
                        {fluid.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Distancia entre Placas (h)
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.L(cParams.h).toFixed(2)} {units.L}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.1"
                        step="0.01"
                        value={cParams.h}
                        onChange={(e) =>
                          setCParams({ ...cParams, h: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Velocidad Placa Superior (U)
                        </span>
                        <span className="text-brand-accent font-mono">
                          {conv.V(cParams.uTop).toFixed(2)} {units.V}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={cParams.uTop}
                        onChange={(e) =>
                          setCParams({
                            ...cParams,
                            uTop: Number(e.target.value),
                          })
                        }
                        className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-brand-accent/5 rounded-2xl border border-brand-accent/20">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                    Gradiente de Velocidad (du/dy)
                  </p>
                  <p className="text-2xl font-mono text-brand-accent">
                    {(cParams.uTop / cParams.h).toFixed(2)}{" "}
                    <span className="text-xs opacity-50">s⁻¹</span>
                  </p>
                  <div className="mt-3 h-2 rounded-full overflow-hidden border border-brand-border/60">
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.05), var(--color-brand-accent))",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] text-[var(--color-text-muted)] font-mono uppercase tracking-widest">
                    <span>Bajo</span>
                    <span>Alto</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 p-8 bg-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10"></div>

                {/* -- Vista 3D -- */}
                <div
                  className={`w-full h-[420px] relative ${couette3D ? "" : "hidden"}`}
                >
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                        Cargando 3D...
                      </div>
                    }
                  >
                    <Lab3DContainer
                      mode="couette"
                      className="h-full"
                      couetteProps={{
                        uTop: cParams.uTop,
                        h: cParams.h,
                        fluidColor: FLUID_PRESETS[cFluidIdx].hex,
                      }}
                    />
                  </Suspense>
                </div>

                {/* -- Vista 2D -- */}
                <div
                  className={`h-[350px] w-full max-w-md relative border-y-4 border-brand-border bg-[var(--glass-bg)] shadow-inner rounded-sm overflow-hidden ${couette3D ? "hidden" : ""}`}
                >
                  {/* Fluid background */}
                  <div
                    className="absolute inset-0 transition-colors duration-500 opacity-20"
                    style={{ backgroundColor: FLUID_PRESETS[cFluidIdx].hex }}
                  ></div>

                  {/* Moving Plate Indicator (Top) */}
                  <motion.div
                    animate={{ x: [-20, 20] }}
                    transition={{
                      duration: Math.max(0.2, 2 / cParams.uTop),
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "linear",
                    }}
                    className="absolute top-0 left-0 w-full h-2 z-20"
                    style={{
                      backgroundColor: FLUID_PRESETS[cFluidIdx].hex,
                      boxShadow: `0 2px 10px ${FLUID_PRESETS[cFluidIdx].hex}44`,
                    }}
                  >
                    <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_20px)]"></div>
                  </motion.div>

                  {/* Velocity Vectors */}
                  <div className="absolute inset-0 flex flex-col justify-between py-8 px-8">
                    {[...couetteData].reverse().map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <motion.div
                          initial={false}
                          animate={{
                            width: `${(d.u / 5.0) * 100}%`, // Normalized by max velocity (5.0)
                            opacity: 0.3 + (d.u / cParams.uTop) * 0.7,
                          }}
                          className="h-1 rounded-full relative min-w-[2px]"
                          style={{
                            backgroundColor: FLUID_PRESETS[cFluidIdx].hex,
                          }}
                        >
                          {d.u > 0 && (
                            <div
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 rotate-45"
                              style={{
                                borderColor: FLUID_PRESETS[cFluidIdx].hex,
                              }}
                            ></div>
                          )}
                        </motion.div>
                      </div>
                    ))}
                  </div>

                  {/* Shear Stress Visualization (Subtle gradient) */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, ${FLUID_PRESETS[cFluidIdx].hex}11, transparent)`,
                    }}
                  ></div>

                  <div
                    className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-white/80 px-2 py-1 rounded border z-10"
                    style={{
                      color: FLUID_PRESETS[cFluidIdx].hex,
                      borderColor: `${FLUID_PRESETS[cFluidIdx].hex}33`,
                    }}
                  >
                    Placa Móvil (U)
                  </div>
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest glass-card px-2 py-1 rounded border border-brand-border z-10">
                    Placa Fija
                  </div>
                </div>

                <div
                  className={`absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-slate-400 font-mono ${couette3D ? "hidden" : ""}`}
                >
                  <Activity size={12} />
                  PERFIL DE VELOCIDAD LINEAL ({unitSystem})
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* AI Assistant Floating Bubble */}
      <AIAssistant
        input={{
          labContext: "stokes",
          vt,
          rep,
          qValue,
          isNonNewtonian,
          flowIndex,
          uTop: cParams.uTop,
          h: cParams.h,
        }}
      />
    </div>
  );
};
