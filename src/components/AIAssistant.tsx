import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  Droplets,
  Layers,
  MessageCircle,
  SendHorizontal,
  Trash2,
  TriangleAlert,
  X,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UnitContext, type UnitSystem } from "../context/UnitContext";
import { getUnits } from "../utils/units";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type LabContext = "poiseuille" | "stokes" | "couette";

export interface HeuristicInput {
  labContext: LabContext;
  re?: number;
  vt?: number;
  qValue?: number;
  rho?: number;
  mu?: number;
  rep?: number;
  uTop?: number;
  h?: number;
  isNonNewtonian?: boolean;
  flowIndex?: number;
  radius?: number;
  deltaP?: number;
  length?: number;
  particleRadius?: number;
  rhop?: number;
  rhof?: number;
}

type AnalysisTone = "ok" | "warn" | "bad" | "info";
type DeltaTrend = "up" | "down" | "same" | null;

interface AnalysisItem {
  tone: AnalysisTone;
  title: string;
  body: string;
  delta?: DeltaTrend;
  deltaLabel?: string;
}

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

type IntentType =
  | "hypothetical"
  | "value"
  | "validity"
  | "increase"
  | "decrease"
  | "formula"
  | "shear"
  | "stress"
  | "guide"
  | "tips"
  | "howto"
  | "general"
  | "fallback";

interface Intent {
  type: IntentType;
  multiplier?: number;
  param?: string;
  rawQuestion: string;
}

interface LabConfig {
  key: LabContext;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  pill: string;
  quickPrompts: string[];
  keywords: {
    flowrate: string[];
    validity: string[];
    increase: string[];
    decrease: string[];
    value: string[];
    formula: string[];
    shear: string[];
    stress: string[];
    guide: string[];
    tips: string[];
    howto: string[];
  };
}

interface PersistedState {
  open: boolean;
  chat: ChatMsg[];
}

// ─────────────────────────────────────────────
// INTERNATIONALIZATION STRINGS
// ─────────────────────────────────────────────

const I18N = {
  es: {
    // UI Elements
    title: "Asistente FluidLab",
    close: "Cerrar asistente",
    open: "Abrir asistente",
    clearChat: "Limpiar chat",
    typing: "Calculando...",
    inputPlaceholder: "Ej: ¿Qué pasa si duplico el radio?",
    footer: "Heurístico: guía rápida, no reemplaza el informe",
    newMessages: "mensajes nuevos",

    // Analysis tones
    toneAlert: "Alerta",
    toneReview: "Revisar",
    toneInfo: "Info",

    // Context mismatch
    contextMismatch:
      "Mostrando análisis de {active}, pero los parámetros activos son de {input}.",

    // Validation messages
    insufficientData: "Datos insuficientes",
    adjustParams:
      "Ajusta los parámetros en el laboratorio para obtener un análisis completo.",

    // Welcome messages
    welcomePoiseuille:
      "Hola, estoy aquí para ayudarte con Lab 01 - Poiseuille. Puedes preguntarme sobre la fórmula, cómo aumentar o disminuir el caudal, o la validez de las ecuaciones. Por ejemplo, ¿quieres saber qué pasa si cambias el radio?",
    welcomeStokes:
      "Hola, estoy aquí para ayudarte con Lab 02 - Stokes. Puedes preguntarme sobre la velocidad terminal, la validez de Stokes, o cómo hacer que la partícula caiga más lento o más rápido.",
    welcomeCouette:
      "Hola, estoy aquí para ayudarte con Lab 03 - Couette. Puedes preguntarme sobre el gradiente de velocidad, el esfuerzo cortante, o qué pasa si cambias la separación entre placas.",

    // Error messages
    errorProcessing:
      "Ocurrió un error al procesar tu pregunta. Verifica los parámetros del laboratorio e intenta de nuevo.",

    // Answers - Poiseuille
    poiseuilleFormula:
      "Ecuación de Hagen-Poiseuille: Q = π·r⁴·ΔP / (8·μ·L). Válida para flujo laminar (Re < 2100), fluido incompresible y Newtoniano en tubo circular.",
    poiseuilleIncrease:
      "Para aumentar Q:\n• Aumenta r → impacto ×r⁴ (el más potente)\n• Aumenta ΔP → efecto lineal\n• Reduce μ → fluidos menos viscosos\n• Reduce L → tubo más corto",
    poiseuilleDecrease:
      "Para disminuir Q:\n• Reduce r → impacto ×r⁴\n• Reduce ΔP\n• Aumenta μ (más viscoso)\n• Aumenta L",
    poiseuilleValidity:
      "Poiseuille es válido para Re < 2100 (laminar), fluido Newtoniano, tubo circular, régimen estacionario.",
    poiseuilleStress:
      "Esfuerzo cortante en la pared: τ_w = r·ΔP/(2L). Crece linealmente desde el centro hasta la pared.",
    poiseuilleNoQ: "No tengo Q calculado aún. Ajusta los parámetros en Lab 01.",

    // Answers - Stokes
    stokesFormula:
      "Ley de Stokes: Vt = 2r²·(ρp−ρf)·g / (9·μ). Válida para Re_p < 1. Equilibrio entre gravedad, boyancia y arrastre viscoso.",
    stokesIncrease:
      "Para que la partícula caiga más rápido:\n• Aumenta r (Vt ∝ r²)\n• Reduce μ\n• Aumenta Δρ = (ρp−ρf)",
    stokesDecrease:
      "Para que la partícula caiga más lento:\n• Reduce r (Vt ∝ r²)\n• Aumenta μ (fluido más viscoso)\n• Reduce Δρ = (ρp−ρf)",
    stokesValidity:
      "Stokes es válido para Re_p < 1. Partículas pequeñas, fluidos viscosos o velocidades bajas favorecen su validez.",
    stokesForce:
      "Fuerza de arrastre: Fd = 6π·μ·r·Vt (Stokes). Al equilibrio: Fd = Fg − Fb.",

    // Answers - Couette
    couetteFormula:
      "Couette simple: τ = μ·(du/dy) = μ·U/h. Perfil de velocidad lineal u(y) = U·y/h. Válido para flujo laminar entre placas planas infinitas.",
    couetteIncrease:
      "Para aumentar du/dy:\n• Aumenta U (velocidad de la placa)\n• Reduce h (separación entre placas)",
    couetteDecrease: "Para disminuir du/dy:\n• Reduce U\n• Aumenta h",
    couetteValidity:
      "Couette simple asume: flujo laminar, placas infinitas, fluido Newtoniano. Válido cuando Re = ρ·U·h/μ ≪ 1500.",
    couetteShear:
      "τ = μ·(du/dy). Para Newtoniano la relación es lineal. Define μ en Lab 03 para calcular τ.",
    couetteNoData: "Necesito h y U para calcular du/dy.",

    // Fallback messages
    fallbackPoiseuille:
      "Puedo ayudar con: ecuación de Poiseuille, cómo cambiar Q, sensibilidad a r⁴, validez (Re), y cálculos hipotéticos. ¿Qué necesitas?",
    fallbackStokes:
      "Puedo ayudar con: validez de Stokes (Re_p), cómo cambiar Vt, fuerza de arrastre, y cálculos hipotéticos. ¿Qué necesitas?",
    fallbackCouette:
      "Puedo ayudar con: du/dy, τ (esfuerzo cortante), cálculos hipotéticos (¿qué pasa si reduzco h?), y la relación constitutiva de Newton.",
    fallbackGeneric: "Selecciona un laboratorio para responder con contexto.",
  },
};

// ─────────────────────────────────────────────
// LAB CONFIG
// ─────────────────────────────────────────────

const LAB_CONFIG: Record<LabContext, LabConfig> = {
  poiseuille: {
    key: "poiseuille",
    label: "Lab 01 - Poiseuille",
    shortLabel: "Lab 01",
    icon: <Activity size={14} />,
    pill: "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary",
    quickPrompts: [
      "¿Cómo aumentar el caudal Q?",
      "¿Por qué r⁴ domina el caudal?",
      "¿Qué pasa si duplico el radio?",
    ],
    keywords: {
      flowrate: ["q", "caudal", "flujo", "flow"],
      validity: ["laminar", "régimen", "reynolds", "re"],
      increase: ["aumentar", "subir", "incrementar", "mayor", "más"],
      decrease: ["reducir", "bajar", "disminuir", "menor", "menos"],
      value: ["valor", "cuánto", "resultado", "actual", "dame"],
      formula: [
        "fórmula",
        "ecuación",
        "hagen",
        "poiseuille",
        "r^4",
        "r4",
        "r⁴",
      ],
      shear: [
        "radio",
        "r",
        "longitud",
        "l",
        "viscosidad",
        "mu",
        "presión",
        "deltap",
      ],
      stress: ["esfuerzo", "tau", "cortante", "shear"],
      guide: ["paso a paso", "guia", "guía", "procedimiento"],
      tips: ["tips", "consejos", "sugerencias", "recomendaciones"],
      howto: ["cómo usar", "como usar", "usar la página", "ayuda", "tutorial"],
    },
  },
  stokes: {
    key: "stokes",
    label: "Lab 02 - Stokes",
    shortLabel: "Lab 02",
    icon: <Droplets size={14} />,
    pill: "bg-brand-accent/10 border-brand-accent/20 text-brand-accent",
    quickPrompts: [
      "¿Stokes es válido con este Re_p?",
      "¿Cómo hacer que caiga más lento?",
      "¿Cuál es la velocidad terminal?",
    ],
    keywords: {
      flowrate: ["vt", "velocidad", "terminal", "caída", "settling"],
      validity: ["válido", "validez", "aplica", "rep", "re_p", "reynolds"],
      increase: ["más rápido", "aumentar", "subir", "mayor"],
      decrease: ["más lento", "reducir", "disminuir", "menor"],
      value: ["valor", "cuánto", "resultado", "actual", "dame"],
      formula: ["fórmula", "ecuación", "stokes", "arrastre", "drag"],
      shear: ["partícula", "radio", "densidad", "rho", "tamaño"],
      stress: ["fuerza", "arrastre", "boyancia", "gravedad"],
      guide: ["paso a paso", "guia", "guía", "procedimiento"],
      tips: ["tips", "consejos", "sugerencias", "recomendaciones"],
      howto: ["cómo usar", "como usar", "usar la página", "ayuda", "tutorial"],
    },
  },
  couette: {
    key: "couette",
    label: "Lab 03 - Couette",
    shortLabel: "Lab 03",
    icon: <Layers size={14} />,
    pill: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    quickPrompts: [
      "¿Cuál es du/dy?",
      "¿Cómo se calcula τ (tau)?",
      "¿Qué pasa si reduzco h?",
    ],
    keywords: {
      flowrate: ["du/dy", "gradiente", "perfil", "velocidad"],
      validity: ["newtoniano", "lineal", "laminar"],
      increase: ["aumentar", "mayor", "subir", "más"],
      decrease: ["reducir", "menor", "bajar", "menos"],
      value: ["valor", "cuánto", "resultado", "actual", "dame"],
      formula: ["fórmula", "ecuación", "couette", "newton", "constitutiva"],
      shear: [
        "h",
        "separación",
        "gap",
        "placa",
        "u",
        "velocidad",
        "du/dy",
        "gradiente",
      ],
      stress: ["tau", "esfuerzo", "cortante", "shear", "mu"],
      guide: ["paso a paso", "guia", "guía", "procedimiento"],
      tips: ["tips", "consejos", "sugerencias", "recomendaciones"],
      howto: ["cómo usar", "como usar", "usar la página", "ayuda", "tutorial"],
    },
  },
};

// ─────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ─────────────────────────────────────────────

function isValidPoiseuilleInput(input: HeuristicInput): boolean {
  return (
    Number.isFinite(input.qValue) &&
    Number.isFinite(input.radius) &&
    Number.isFinite(input.deltaP) &&
    Number.isFinite(input.length)
  );
}

function isValidStokesInput(input: HeuristicInput): boolean {
  return (
    Number.isFinite(input.vt) &&
    Number.isFinite(input.rep) &&
    Number.isFinite(input.particleRadius) &&
    Number.isFinite(input.mu)
  );
}

function isValidCouetteInput(input: HeuristicInput): boolean {
  return (
    Number.isFinite(input.h) && input.h !== 0 && Number.isFinite(input.uTop)
  );
}

// ─────────────────────────────────────────────
// ANALYSIS ENGINE
// ─────────────────────────────────────────────

function analysisFor(
  input: HeuristicInput,
  unitSystem: UnitSystem,
  prevInput?: HeuristicInput | null,
): AnalysisItem[] {
  const units = getUnits(unitSystem);
  const items: AnalysisItem[] = [];
  const strings = I18N.es;

  const trend = (curr?: number, prev?: number): DeltaTrend => {
    if (
      curr == null ||
      prev == null ||
      !Number.isFinite(curr) ||
      !Number.isFinite(prev)
    )
      return null;
    if (Math.abs(curr - prev) / (Math.abs(prev) + 1e-300) < 0.001)
      return "same";
    return curr > prev ? "up" : "down";
  };

  if (input.labContext === "poiseuille") {
    if (!isValidPoiseuilleInput(input)) {
      return [
        {
          tone: "warn",
          title: strings.insufficientData,
          body: strings.adjustParams,
          delta: null,
        },
      ];
    }

    const q = input.qValue!;
    const qDelta = trend(input.qValue, prevInput?.qValue);
    const qPct =
      prevInput?.qValue != null &&
      Number.isFinite(prevInput.qValue) &&
      prevInput.qValue !== 0
        ? (((q - prevInput.qValue) / Math.abs(prevInput.qValue)) * 100).toFixed(
            1,
          )
        : null;

    items.push({
      tone: "info",
      title: "Caudal calculado (Q)",
      body: `${q.toExponential(3)} ${units.Q}`,
      delta: qDelta,
      deltaLabel:
        qPct != null ? `${Number(qPct) > 0 ? "+" : ""}${qPct}%` : undefined,
    });

    if (q < 1e-6) {
      items.push({
        tone: "warn",
        title: "Caudal muy bajo",
        body: "Posibles causas: ΔP bajo, μ alta, r pequeño o L muy grande. Recuerda Q ∝ r⁴·ΔP / (μ·L).",
      });
    } else if (q > 0.01) {
      items.push({
        tone: "warn",
        title: "Caudal muy alto",
        body: "Verifica r: pequeños cambios en r cambian mucho Q (r⁴).",
      });
    } else {
      items.push({
        tone: "ok",
        title: "Rango nominal",
        body: "Q está en un rango típico para flujo laminar en un tubo.",
      });
    }

    if (Number.isFinite(input.re)) {
      const re = input.re!;
      const reDelta = trend(input.re, prevInput?.re);
      items.push({
        tone: re < 2100 ? "ok" : re < 4000 ? "warn" : "bad",
        title: `Número de Reynolds (Re = ${re.toFixed(0)})`,
        body:
          re < 2100
            ? "Flujo laminar confirmado. Poiseuille es válido."
            : re < 4000
              ? "Zona de transición. Resultados menos predecibles."
              : "Flujo turbulento. Poiseuille NO aplica.",
        delta: reDelta,
      });
    }

    if (input.isNonNewtonian) {
      const n = input.flowIndex ?? 1;
      items.push({
        tone: "info",
        title:
          n < 1
            ? `No Newtoniano: pseudoplástico (n = ${n.toFixed(2)})`
            : `No Newtoniano: dilatante (n = ${n.toFixed(2)})`,
        body:
          n < 1
            ? "La viscosidad aparente disminuye con la tasa de deformación."
            : "La resistencia aumenta con la tasa de deformación.",
      });
    }

    return items;
  }

  if (input.labContext === "stokes") {
    if (!isValidStokesInput(input)) {
      return [
        {
          tone: "warn",
          title: strings.insufficientData,
          body: strings.adjustParams,
          delta: null,
        },
      ];
    }

    const vt = input.vt!;
    const rep = input.rep!;
    const vtDelta = trend(input.vt, prevInput?.vt);
    const repDelta = trend(input.rep, prevInput?.rep);

    items.push({
      tone: "info",
      title: "Velocidad terminal (Vt)",
      body: `${vt.toExponential(3)} ${units.V}`,
      delta: vtDelta,
    });

    items.push({
      tone: rep < 1 ? "ok" : "bad",
      title: `Reynolds de partícula (Re_p = ${rep.toFixed(3)})`,
      body:
        rep < 1
          ? "Dentro del rango de validez de Stokes."
          : "Fuera del rango. Usa Schiller-Naumann.",
      delta: repDelta,
    });

    if (rep < 0.1) {
      items.push({
        tone: "ok",
        title: "Validez alta",
        body: "Re_p ≪ 1: Stokes es altamente precisa.",
      });
    } else if (rep < 1) {
      items.push({
        tone: "warn",
        title: "Validez marginal",
        body: "Re_p < 1: Stokes aplica, pero puede haber ligera desviación (~5%).",
      });
    } else {
      items.push({
        tone: "bad",
        title: "Fuera de rango",
        body: "Re_p > 1: Stokes no aplica. Usa una correlación de arrastre (Schiller-Naumann).",
      });
    }

    return items;
  }

  if (input.labContext === "couette") {
    if (!isValidCouetteInput(input)) {
      return [
        {
          tone: "warn",
          title: strings.insufficientData,
          body: strings.adjustParams,
          delta: null,
        },
      ];
    }

    const h = input.h!;
    const uTop = input.uTop!;
    const shear = uTop / h;
    const prevShear =
      prevInput?.h && prevInput.h !== 0
        ? (prevInput.uTop ?? 0) / prevInput.h
        : undefined;
    const shearDelta = trend(shear, prevShear);
    const mu = input.mu;
    const tau = mu != null ? mu * shear : null;

    items.push({
      tone: "info",
      title: "Gradiente de velocidad (du/dy)",
      body: `${shear.toFixed(2)} s⁻¹`,
      delta: shearDelta,
    });

    if (tau != null) {
      const prevTau =
        mu != null && prevShear != null ? mu * prevShear : undefined;
      items.push({
        tone: "info",
        title: "Esfuerzo cortante (τ = μ·du/dy)",
        body: `${tau.toFixed(4)} Pa`,
        delta: trend(tau, prevTau),
      });
    }

    items.push({
      tone: shear < 10 ? "ok" : shear < 100 ? "warn" : "bad",
      title:
        shear < 10
          ? "Tasa de corte baja"
          : shear < 100
            ? "Tasa de corte moderada"
            : "Tasa de corte alta",
      body:
        shear < 10
          ? "Flujo suave y controlado."
          : shear < 100
            ? "Esfuerzo cortante significativo."
            : "Puede inducir calentamiento viscoso en fluidos muy viscosos.",
    });

    items.push({
      tone: "info",
      title: "Relación constitutiva",
      body: "Para Newtoniano: τ = μ·(du/dy). Perfil de velocidad lineal.",
    });
    return items;
  }

  return [
    {
      tone: "info",
      title: "Asistente",
      body: strings.fallbackGeneric,
      delta: null,
    },
  ];
}

// ─────────────────────────────────────────────
// NLP ENGINE
// ─────────────────────────────────────────────

function detectIntent(q: string, labCtx: LabContext): Intent {
  const low = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const multiplierMap: Record<string, number> = {
    duplic: 2,
    dobl: 2,
    x2: 2,
    "2x": 2,
    triplic: 3,
    x3: 3,
    "3x": 3,
    mitad: 0.5,
    "la mitad": 0.5,
    mediad: 0.5,
    cuadruplic: 4,
    x4: 4,
    "diez veces": 10,
    x10: 10,
  };

  let multiplier: number | undefined;
  for (const [key, val] of Object.entries(multiplierMap)) {
    if (low.includes(key)) {
      multiplier = val;
      break;
    }
  }

  const hypotheticalTriggers = [
    "si ",
    "que pasa",
    "qué pasa",
    "supong",
    "imagin",
    "si aument",
    "si reduz",
    "si duplic",
    "si dismin",
  ];
  const isHypothetical =
    hypotheticalTriggers.some((t) => low.includes(t)) || multiplier != null;

  const paramMap: Record<string, string[]> = {
    radius: [
      "radio",
      " r ",
      "r^4",
      "r4",
      "r⁴",
      "radio del tubo",
      "tamaño de part",
    ],
    deltaP: [
      "deltap",
      "delta p",
      "presion",
      "presión",
      "dp",
      "caida de presion",
    ],
    length: [" l ", "longitud", "largo", "tubo"],
    mu: ["mu", "viscosidad", "viscous"],
    uTop: ["velocidad de la placa", "u_top", "utop", "u top", "placa superior"],
    h: [" h ", "separacion", "separación", "gap", "altura"],
  };

  let param: string | undefined;
  for (const [key, terms] of Object.entries(paramMap)) {
    if (terms.some((t) => low.includes(t))) {
      param = key;
      break;
    }
  }

  const cfg = LAB_CONFIG[labCtx];

  if (isHypothetical)
    return { type: "hypothetical", multiplier, param, rawQuestion: q };
  if (cfg.keywords.validity.some((k) => low.includes(k)))
    return { type: "validity", rawQuestion: q };
  if (cfg.keywords.value.some((k) => low.includes(k)))
    return { type: "value", rawQuestion: q };
  if (cfg.keywords.increase.some((k) => low.includes(k)))
    return { type: "increase", rawQuestion: q };
  if (cfg.keywords.decrease.some((k) => low.includes(k)))
    return { type: "decrease", rawQuestion: q };
  if (cfg.keywords.formula.some((k) => low.includes(k)))
    return { type: "formula", rawQuestion: q };
  if (cfg.keywords.shear.some((k) => low.includes(k)))
    return { type: "shear", rawQuestion: q };
  if (cfg.keywords.stress.some((k) => low.includes(k)))
    return { type: "stress", rawQuestion: q };
  if (cfg.keywords.guide.some((k) => low.includes(k)))
    return { type: "guide", rawQuestion: q };
  if (cfg.keywords.tips.some((k) => low.includes(k)))
    return { type: "tips", rawQuestion: q };
  if (cfg.keywords.howto.some((k) => low.includes(k)))
    return { type: "howto", rawQuestion: q };

  // General questions about fluid dynamics or the page
  const generalKeywords = [
    "fluidos",
    "dinámica",
    "mecánica",
    "página",
    "sitio",
    "laboratorio",
    "experimento",
    "teoría",
    "física",
    "ingeniería",
    "quién",
    "qué es",
    "cómo funciona",
    "ayuda",
    "información",
  ];
  if (generalKeywords.some((k) => low.includes(k)))
    return { type: "general", rawQuestion: q };

  return { type: "fallback", rawQuestion: q };
}

function answerQuestion(
  q: string,
  input: HeuristicInput,
  unitSystem: UnitSystem,
  history: ChatMsg[],
): string {
  const units = getUnits(unitSystem);
  const strings = I18N.es;

  if (!q.trim()) return "Escribe una pregunta.";

  const intent = detectIntent(q, input.labContext);

  const lastAssistant =
    [...history].reverse().find((m) => m.role === "assistant")?.text ?? "";
  const isFollowUp =
    q.toLowerCase().includes("y si") ||
    q.toLowerCase().includes("¿y") ||
    q.toLowerCase().includes("entonces");
  const followUpCtx =
    isFollowUp && lastAssistant
      ? `(Contexto previo: "${lastAssistant.slice(0, 120)}") `
      : "";

  // ── POISEUILLE ──
  if (input.labContext === "poiseuille") {
    const { qValue, radius, deltaP, length, mu, re } = input;

    if (intent.type === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && radius != null && qValue != null) {
        const newR = radius * mult;
        const newQ = qValue * Math.pow(mult, 4);
        const factor = Math.pow(mult, 4).toFixed(1);
        return `${followUpCtx}Si el radio cambia de ${radius.toExponential(2)} m a ${newR.toExponential(2)} m (×${mult}), Q aumenta ×${factor} (r⁴). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "deltaP" && qValue != null) {
        const newQ = qValue * mult;
        return `${followUpCtx}Si ΔP se multiplica ×${mult}, Q también se multiplica ×${mult} (relación lineal). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "mu" && qValue != null) {
        const newQ = qValue / mult;
        return `${followUpCtx}Si μ aumenta ×${mult}, Q disminuye ×${mult} (Q ∝ 1/μ). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "length" && qValue != null) {
        const newQ = qValue / mult;
        return `${followUpCtx}Si L se multiplica ×${mult}, Q se reduce ×${mult} (Q ∝ 1/L). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      return `${followUpCtx}Para un cambio ×${mult}, usa Q = (π·r⁴·ΔP)/(8·μ·L). El parámetro más sensible es r (Q ∝ r⁴).`;
    }

    if (intent.type === "formula") return strings.poiseuilleFormula;

    if (intent.type === "value") {
      if (Number.isFinite(qValue))
        return `Q actual: ${qValue!.toExponential(3)} ${units.Q}.${radius ? ` Radio: ${radius.toExponential(2)} m.` : ""}`;
      return strings.poiseuilleNoQ;
    }

    if (intent.type === "increase") return strings.poiseuilleIncrease;

    if (intent.type === "decrease") return strings.poiseuilleDecrease;

    if (intent.type === "validity") {
      if (Number.isFinite(re)) {
        const reNum = re!;
        return reNum < 2100
          ? `Re = ${reNum.toFixed(0)} → flujo laminar. Poiseuille es válido.`
          : `Re = ${reNum.toFixed(0)} → ${reNum < 4000 ? "transición" : "turbulento"}. Poiseuille NO aplica.`;
      }
      return strings.poiseuilleValidity;
    }

    if (intent.type === "stress") {
      if (radius != null && deltaP != null && length != null) {
        const tauMax = (radius * deltaP) / (2 * length);
        return `Esfuerzo cortante máximo en la pared: τ_w = r·ΔP/(2L) = ${tauMax.toFixed(4)} Pa. En el centro del tubo τ = 0.`;
      }
      return strings.poiseuilleStress;
    }

    return `${followUpCtx}${strings.fallbackPoiseuille}`;
  }

  // ── STOKES ──
  if (input.labContext === "stokes") {
    const { vt, rep, mu, particleRadius } = input;

    if (intent.type === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && particleRadius != null && vt != null) {
        const newVt = vt * Math.pow(mult, 2);
        return `${followUpCtx}Si el radio de partícula aumenta ×${mult}, Vt aumenta ×${Math.pow(mult, 2).toFixed(0)} (Vt ∝ r²). Nuevo Vt estimado: ${newVt.toExponential(3)} ${units.V}.`;
      }
      if (param === "mu" && vt != null) {
        const newVt = vt / mult;
        return `${followUpCtx}Si μ aumenta ×${mult}, Vt disminuye ×${mult} (Vt ∝ 1/μ). Nuevo Vt estimado: ${newVt.toExponential(3)} ${units.V}.`;
      }
      return `${followUpCtx}Para un cambio ×${mult}, usa Vt = 2r²(ρp−ρf)g / (9μ). Los parámetros más sensibles son r (Vt ∝ r²) y μ.`;
    }

    if (intent.type === "formula") return strings.stokesFormula;

    if (intent.type === "validity") {
      if (Number.isFinite(rep)) {
        const r = rep!;
        return r < 0.1
          ? `Re_p = ${r.toFixed(3)} ≪ 1: Stokes es altamente precisa (error < 1%).`
          : r < 1
            ? `Re_p = ${r.toFixed(3)} < 1: Stokes aplica con desviación ligera (~5%).`
            : `Re_p = ${r.toFixed(3)} > 1: Stokes no aplica. Usa Schiller-Naumann: Cd = 24/Re_p·(1+0.15·Re_p⁰·⁶⁸⁷).`;
      }
      return strings.stokesValidity;
    }

    if (intent.type === "value") {
      const parts: string[] = [];
      if (Number.isFinite(vt))
        parts.push(`Vt = ${vt!.toExponential(3)} ${units.V}`);
      if (Number.isFinite(rep)) parts.push(`Re_p = ${rep!.toFixed(3)}`);
      return parts.length
        ? parts.join(", ") + "."
        : "Ajusta parámetros en Lab 02 primero.";
    }

    if (intent.type === "decrease") return strings.stokesDecrease;

    if (intent.type === "increase") return strings.stokesIncrease;

    if (intent.type === "stress") {
      if (Number.isFinite(vt) && mu != null && particleRadius != null) {
        const fd = 6 * Math.PI * mu * particleRadius * vt!;
        return `Fuerza de arrastre de Stokes: Fd = 6π·μ·r·Vt = ${fd.toExponential(3)} N.`;
      }
      return strings.stokesForce;
    }

    return `${followUpCtx}${strings.fallbackStokes}`;
  }

  // ── COUETTE ──
  if (input.labContext === "couette") {
    const h = input.h ?? 0;
    const uTop = input.uTop ?? 0;
    const mu = input.mu;
    const shear = h !== 0 ? uTop / h : NaN;

    if (intent.type === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "h" && Number.isFinite(shear)) {
        const newShear = shear / mult;
        const newTau = mu != null ? mu * newShear : null;
        return `${followUpCtx}Si h aumenta ×${mult}, du/dy = U/h disminuye ×${mult}. Nuevo gradiente: ${newShear.toFixed(2)} s⁻¹.${newTau != null ? ` τ nuevo: ${newTau.toFixed(4)} Pa.` : ""}`;
      }
      if (param === "uTop" && Number.isFinite(shear)) {
        const newShear = shear * mult;
        const newTau = mu != null ? mu * newShear : null;
        return `${followUpCtx}Si U aumenta ×${mult}, du/dy también ×${mult}. Nuevo gradiente: ${newShear.toFixed(2)} s⁻¹.${newTau != null ? ` τ nuevo: ${newTau.toFixed(4)} Pa.` : ""}`;
      }
      return `${followUpCtx}Para un cambio ×${mult}: du/dy = U/h. Si cambias h o U, el gradiente escala en consecuencia.`;
    }

    if (intent.type === "formula") return strings.couetteFormula;

    if (intent.type === "shear" || intent.type === "value") {
      if (Number.isFinite(shear)) {
        const parts = [`du/dy = ${shear.toFixed(2)} s⁻¹`];
        if (mu != null) parts.push(`τ = ${(mu * shear).toFixed(4)} Pa`);
        return parts.join(", ") + ".";
      }
      return strings.couetteNoData;
    }

    if (intent.type === "stress") {
      if (Number.isFinite(shear) && mu != null)
        return `τ = μ·du/dy = ${mu}·${shear.toFixed(2)} = ${(mu * shear).toFixed(4)} Pa.`;
      return strings.couetteShear;
    }

    if (intent.type === "increase") return strings.couetteIncrease;

    if (intent.type === "decrease") return strings.couetteDecrease;

    if (intent.type === "validity") return strings.couetteValidity;

    return `${followUpCtx}${strings.fallbackCouette}`;
  }

  return strings.fallbackGeneric;
}

function answerQuestionV2(
  q: string,
  input: HeuristicInput,
  unitSystem: UnitSystem,
  history: ChatMsg[],
): string {
  const units = getUnits(unitSystem);
  const strings = I18N.es;
  const text = q.trim();
  if (!text) return "Escribe una pregunta.";

  const low = text.toLowerCase();
  const wantsGuide =
    low.includes("paso a paso") ||
    low.includes("guia") ||
    low.includes("guía") ||
    low.includes("procedimiento");
  const wantsTips =
    low.includes("tips") ||
    low.includes("consejos") ||
    low.includes("sugerencias") ||
    low.includes("recomendaciones");

  const intent = detectIntent(text, input.labContext);
  let intentType = intent.type;

  const lastAssistant =
    [...history].reverse().find((m) => m.role === "assistant")?.text ?? "";
  const isFollowUp =
    low.includes("y si") || low.includes("¿y") || low.includes("entonces");
  const followUpCtx =
    isFollowUp && lastAssistant
      ? `(Contexto previo: "${lastAssistant.slice(0, 120)}") `
      : "";

  const fmtNumber = (value: number, digits = 3) => {
    const abs = Math.abs(value);
    if (abs === 0) return "0";
    if (abs >= 1e3 || abs < 1e-2) return value.toExponential(digits);
    return value.toFixed(digits);
  };

  const fmt = (value: number, unit?: string, digits = 3) =>
    `${fmtNumber(value, digits)}${unit ? ` ${unit}` : ""}`;

  const lines = (arr: (string | null)[]) =>
    arr.filter(Boolean).join("\n") as string;

  const listMissing = (items: string[]) =>
    items.length ? items.join(", ") : "—";

  const g = 9.81;

  const canComputePoiseuille =
    input.radius != null &&
    input.deltaP != null &&
    input.mu != null &&
    input.length != null;
  const qFromParams = canComputePoiseuille
    ? (Math.PI * Math.pow(input.radius!, 4) * input.deltaP!) /
      (8 * input.mu! * input.length!)
    : null;

  const tauWall =
    input.radius != null && input.deltaP != null && input.length != null
      ? (input.radius * input.deltaP) / (2 * input.length)
      : null;

  const canComputeStokes =
    input.particleRadius != null &&
    input.rhop != null &&
    input.rhof != null &&
    input.mu != null;
  const vtFromParams = canComputeStokes
    ? (2 *
        Math.pow(input.particleRadius!, 2) *
        (input.rhop! - input.rhof!) *
        g) /
      (9 * input.mu!)
    : null;

  const repFromParams =
    input.rhof != null &&
    input.particleRadius != null &&
    input.mu != null &&
    (input.vt != null || vtFromParams != null)
      ? (2 * input.particleRadius * input.rhof * (input.vt ?? vtFromParams!)) /
        input.mu
      : null;

  const shear =
    input.h != null && input.uTop != null && input.h !== 0
      ? input.uTop / input.h
      : null;
  const tauCouette =
    shear != null && input.mu != null ? input.mu * shear : null;

  // Handle general questions about fluid dynamics or the page
  if (intentType === "general") {
    const t = low;
    if (t.includes("quién") || t.includes("autor") || t.includes("creador")) {
      return "Esta página fue creada por estudiantes de ingeniería para aprender sobre dinámica de fluidos viscosos. Incluye laboratorios virtuales interactivos para experimentos de Poiseuille, Stokes y Couette.";
    }
    if (t.includes("qué es") || t.includes("fluidos")) {
      return "La dinámica de fluidos es el estudio del movimiento de fluidos y las fuerzas que actúan sobre ellos. Esta página se enfoca en fluidos viscosos y sedimentación de partículas.";
    }
    if (t.includes("página") || t.includes("sitio")) {
      return "Este es un laboratorio virtual educativo con simulaciones interactivas de tres experimentos clásicos: flujo en tubos (Poiseuille), sedimentación (Stokes) y flujo entre placas (Couette). Incluye teoría, ejercicios resueltos y un asistente IA.";
    }
    if (t.includes("laboratorio") || t.includes("experimento")) {
      return "Hay tres laboratorios: 1) Poiseuille: flujo laminar en tubos. 2) Stokes: sedimentación de partículas. 3) Couette: flujo entre placas paralelas. Cada uno tiene controles interactivos y análisis en tiempo real.";
    }
    if (t.includes("teoría")) {
      return "La sección de teoría explica los principios físicos de cada experimento, incluyendo ecuaciones, diagramas interactivos y conceptos clave de mecánica de fluidos.";
    }
    if (t.includes("ayuda") || t.includes("cómo")) {
      return "Usa los controles deslizantes en cada laboratorio para cambiar parámetros y observa cómo afectan los resultados. El asistente IA puede responder preguntas específicas sobre cálculos y conceptos.";
    }
    return "Esta es una herramienta educativa para aprender dinámica de fluidos. Explora los laboratorios virtuales, lee la teoría o pregunta al asistente sobre cualquier concepto relacionado con fluidos viscosos.";
  }

  // If intent is unclear, infer from tokens.
  if (intentType === "fallback") {
    const t = low;
    if (
      t.includes("q") ||
      t.includes("caudal") ||
      t.includes("flujo") ||
      t.includes("flowrate")
    ) {
      intentType = "value";
    } else if (t.includes("vt") || t.includes("velocidad terminal")) {
      intentType = "value";
    } else if (t.includes("re") || t.includes("reynolds")) {
      intentType = "validity";
    } else if (t.includes("du/dy") || t.includes("gradiente")) {
      intentType = "shear";
    } else if (t.includes("tau") || t.includes("esfuerzo")) {
      intentType = "stress";
    }
  }

  const inferLabFromQuestion = (): LabContext | null => {
    const score: Record<LabContext, number> = {
      poiseuille: 0,
      stokes: 0,
      couette: 0,
    };
    (Object.keys(LAB_CONFIG) as LabContext[]).forEach((ctx) => {
      const kw = LAB_CONFIG[ctx].keywords;
      const buckets = [
        kw.flowrate,
        kw.validity,
        kw.increase,
        kw.decrease,
        kw.value,
        kw.formula,
        kw.shear,
        kw.stress,
        kw.guide,
        kw.tips,
        kw.howto,
      ];
      buckets.flat().forEach((k) => {
        if (low.includes(k)) score[ctx] += 1;
      });
    });
    const best = (Object.keys(score) as LabContext[]).sort(
      (a, b) => score[b] - score[a],
    )[0];
    return score[best] > 0 ? best : null;
  };

  const guideFor = (ctx: LabContext) => {
    if (ctx === "poiseuille") {
      return [
        "1. Define r, L y ΔP con valores realistas.",
        "2. Selecciona la viscosidad μ del fluido.",
        "3. Verifica Re < 2100 para flujo laminar.",
        "4. Observa Q y ajusta r (impacto r⁴).",
      ].join("\n");
    }
    if (ctx === "stokes") {
      return [
        "1. Define r, ρp, ρf y μ del fluido.",
        "2. Observa Vt y Re_p.",
        "3. Si Re_p > 1, reduce r o aumenta μ.",
        "4. Ajusta Δρ para acelerar o frenar la caída.",
      ].join("\n");
    }
    return [
      "1. Define h (separación) y U (velocidad superior).",
      "2. Calcula du/dy = U/h.",
      "3. Si tienes μ, calcula τ = μ·du/dy.",
      "4. Ajusta U o h para el gradiente deseado.",
    ].join("\n");
  };

  const tipsFor = (ctx: LabContext, extra: string[] = []) => {
    const base =
      ctx === "poiseuille"
        ? [
            "Aumentar r es el cambio más potente (Q ∝ r⁴).",
            "Mantén Re < 2100 para validez laminar.",
          ]
        : ctx === "stokes"
          ? [
              "Para bajar Vt: reduce r o aumenta μ.",
              "Busca Re_p < 1 para validez de Stokes.",
            ]
          : [
              "du/dy es lineal con U e inverso con h.",
              "Si τ es alto, aumenta h o reduce U.",
            ];
    return ["Tips:", ...base, ...extra]
      .map((t, i) => (i === 0 ? t : `• ${t}`))
      .join("\n");
  };

  if (wantsGuide) {
    return `Guía rápida:\n${guideFor(input.labContext)}`;
  }

  if (wantsTips) {
    return tipsFor(input.labContext);
  }

  if (intentType === "howto") {
    return [
      "Cómo usar la página:",
      "1. En el menú superior elige Teoría, Ejercicios, Calculadoras o Labs.",
      "2. En cada Lab ajusta parámetros con los sliders.",
      "3. Revisa los resultados y gráficos en tiempo real.",
      "4. Activa 3D si quieres visualizar el fenómeno.",
      "5. Cambia unidades (SI/USCS) desde el header.",
      "6. Usa este asistente para dudas, tips o verificación de rangos.",
    ].join("\n");
  }

  // — POISEUILLE —
  if (input.labContext === "poiseuille") {
    const { qValue, radius, deltaP, length, mu, re, isNonNewtonian } = input;
    const qResolved = qValue ?? qFromParams;
    const qLabel = qValue == null && qFromParams != null ? "Q (estimado)" : "Q";

    if (intentType === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && radius != null && qResolved != null) {
        const newR = radius * mult;
        const newQ = qResolved * Math.pow(mult, 4);
        const factor = Math.pow(mult, 4).toFixed(1);
        return `${followUpCtx}Si el radio cambia de ${fmt(radius, units.L)} a ${fmt(newR, units.L)} (×${mult}), Q aumenta ×${factor} (r⁴). Nuevo Q estimado: ${fmt(newQ, units.Q)}.`;
      }
      if (param === "deltaP" && qResolved != null) {
        const newQ = qResolved * mult;
        return `${followUpCtx}Si ΔP se multiplica ×${mult}, Q también se multiplica ×${mult} (relación lineal). Nuevo Q estimado: ${fmt(newQ, units.Q)}.`;
      }
      if (param === "mu" && qResolved != null) {
        const newQ = qResolved / mult;
        return `${followUpCtx}Si μ aumenta ×${mult}, Q disminuye ×${mult} (Q ∝ 1/μ). Nuevo Q estimado: ${fmt(newQ, units.Q)}.`;
      }
      if (param === "length" && qResolved != null) {
        const newQ = qResolved / mult;
        return `${followUpCtx}Si L se multiplica ×${mult}, Q se reduce ×${mult} (Q ∝ 1/L). Nuevo Q estimado: ${fmt(newQ, units.Q)}.`;
      }
      return `${followUpCtx}Para un cambio ×${mult}, usa Q = (π·r⁴·ΔP)/(8·μ·L). El parámetro más sensible es r (Q ∝ r⁴).`;
    }

    if (intentType === "formula") return strings.poiseuilleFormula;

    if (intentType === "value") {
      const missing = [
        radius == null ? "r" : null,
        deltaP == null ? "ΔP" : null,
        mu == null ? "μ" : null,
        length == null ? "L" : null,
      ].filter(Boolean) as string[];

      if (Number.isFinite(qResolved)) {
        const verif =
          re != null
            ? re < 2100
              ? "• Re < 2100: válido (laminar)"
              : "• Re > 2100: fuera de rango laminar"
            : "• Re: no disponible";

        const extraTips: string[] = [];
        if (re != null && re > 2100)
          extraTips.push("Reduce r o ΔP para bajar Re.");
        if (isNonNewtonian)
          extraTips.push(
            "Modo no-Newtoniano activo: Poiseuille puede no aplicar.",
          );

        return [
          "Resultado actual:",
          lines([
            `• ${qLabel} = ${fmt(qResolved!, units.Q)}`,
            radius != null ? `• r = ${fmt(radius, units.L)}` : null,
            deltaP != null ? `• ΔP = ${fmt(deltaP, units.P)}` : null,
            mu != null ? `• μ = ${fmt(mu, units.M, 4)}` : null,
            length != null ? `• L = ${fmt(length, units.L)}` : null,
            tauWall != null ? `• τ_w = ${fmt(tauWall, "Pa", 4)}` : null,
          ]),
          "Verificación:",
          verif,
          tipsFor("poiseuille", extraTips),
        ].join("\n");
      }
      return `${strings.poiseuilleNoQ}\nDatos faltantes: ${listMissing(
        missing,
      )}.`;
    }

    if (intentType === "increase") return strings.poiseuilleIncrease;
    if (intentType === "decrease") return strings.poiseuilleDecrease;

    if (intentType === "validity") {
      if (Number.isFinite(re)) {
        const reNum = re!;
        return reNum < 2100
          ? `Re = ${reNum.toFixed(0)} → flujo laminar. Poiseuille es válido.`
          : `Re = ${reNum.toFixed(0)} → ${reNum < 4000 ? "transición" : "turbulento"}. Poiseuille NO aplica.`;
      }
      return `${strings.poiseuilleValidity}\nSugerencia: activa Re en el panel para validar automáticamente.`;
    }

    if (intentType === "stress") {
      if (tauWall != null) {
        return `Esfuerzo cortante máximo en la pared: τ_w = r·ΔP/(2L) = ${fmt(
          tauWall,
          "Pa",
          4,
        )}. En el centro del tubo τ = 0.`;
      }
      return strings.poiseuilleStress;
    }

    return (
      `${followUpCtx}${strings.fallbackPoiseuille}\n` +
      "Dime si quieres: Q, Re, τ_w o un cálculo hipotético."
    );
  }

  // — STOKES —
  if (input.labContext === "stokes") {
    const { vt, rep, mu, particleRadius, rhop, rhof } = input;
    const vtResolved = vt ?? vtFromParams;
    const repResolved = rep ?? repFromParams;
    const deltaRho = rhop != null && rhof != null ? rhop - rhof : null;

    if (intentType === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && particleRadius != null && vtResolved != null) {
        const newVt = vtResolved * Math.pow(mult, 2);
        return `${followUpCtx}Si el radio de partícula aumenta ×${mult}, Vt aumenta ×${Math.pow(mult, 2).toFixed(0)} (Vt ∝ r²). Nuevo Vt estimado: ${fmt(newVt, units.V)}.`;
      }
      if (param === "mu" && vtResolved != null) {
        const newVt = vtResolved / mult;
        return `${followUpCtx}Si μ aumenta ×${mult}, Vt disminuye ×${mult} (Vt ∝ 1/μ). Nuevo Vt estimado: ${fmt(newVt, units.V)}.`;
      }
      return `${followUpCtx}Para un cambio ×${mult}, usa Vt = 2r²(ρp−ρf)g / (9μ). Los parámetros más sensibles son r (Vt ∝ r²) y μ.`;
    }

    if (intentType === "formula") return strings.stokesFormula;

    if (intentType === "validity") {
      if (Number.isFinite(repResolved)) {
        const r = repResolved!;
        return r < 0.1
          ? `Re_p = ${r.toFixed(3)} ≪ 1: Stokes es altamente precisa (error < 1%).`
          : r < 1
            ? `Re_p = ${r.toFixed(3)} < 1: Stokes aplica con desviación ligera (~5%).`
            : `Re_p = ${r.toFixed(3)} > 1: Stokes no aplica. Usa Schiller-Naumann: Cd = 24/Re_p·(1+0.15·Re_p^0.687).`;
      }
      return `${strings.stokesValidity}\nSugerencia: reduce r o aumenta μ para bajar Re_p.`;
    }

    if (intentType === "value") {
      const missing = [
        particleRadius == null ? "r" : null,
        mu == null ? "μ" : null,
        rhop == null ? "ρp" : null,
        rhof == null ? "ρf" : null,
      ].filter(Boolean) as string[];

      if (Number.isFinite(vtResolved)) {
        const verif =
          repResolved != null
            ? repResolved < 1
              ? "• Re_p < 1: válido (Stokes)"
              : "• Re_p > 1: fuera de rango"
            : "• Re_p: no disponible";

        const extraTips: string[] = [];
        if (deltaRho != null && deltaRho <= 0)
          extraTips.push(
            "Δρ ≤ 0: la partícula no sedimenta (flota o queda neutra).",
          );
        if (repResolved != null && repResolved > 1)
          extraTips.push("Reduce r o aumenta μ para bajar Re_p.");

        return [
          "Resultado actual:",
          lines([
            `• Vt = ${fmt(vtResolved!, units.V)}`,
            repResolved != null ? `• Re_p = ${repResolved.toFixed(3)}` : null,
            deltaRho != null ? `• Δρ = ${fmt(deltaRho, "kg/m³")}` : null,
          ]),
          "Verificación:",
          verif,
          tipsFor("stokes", extraTips),
        ].join("\n");
      }
      return `Ajusta parámetros en Lab 02.\nDatos faltantes: ${listMissing(
        missing,
      )}.`;
    }

    if (intentType === "decrease") return strings.stokesDecrease;
    if (intentType === "increase") return strings.stokesIncrease;

    if (intentType === "stress") {
      if (Number.isFinite(vtResolved) && mu != null && particleRadius != null) {
        const fd = 6 * Math.PI * mu * particleRadius * vtResolved!;
        return `Fuerza de arrastre de Stokes: Fd = 6π·μ·r·Vt = ${fmt(fd, "N")}.`;
      }
      return strings.stokesForce;
    }

    return (
      `${followUpCtx}${strings.fallbackStokes}\n` +
      "Dime si quieres: Vt, Re_p, Fd o un cálculo hipotético."
    );
  }

  // — COUETTE —
  if (input.labContext === "couette") {
    const { h, uTop, mu, rho } = input;
    const reCouette =
      rho != null && mu != null && h != null && uTop != null && mu !== 0
        ? (rho * uTop * h) / mu
        : null;

    if (intentType === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "h" && shear != null) {
        const newShear = shear / mult;
        const newTau = mu != null ? mu * newShear : null;
        return `${followUpCtx}Si h aumenta ×${mult}, du/dy = U/h disminuye ×${mult}. Nuevo gradiente: ${fmt(newShear, "s⁻¹", 2)}.${newTau != null ? ` τ nuevo: ${fmt(newTau, "Pa", 4)}.` : ""}`;
      }
      if (param === "uTop" && shear != null) {
        const newShear = shear * mult;
        const newTau = mu != null ? mu * newShear : null;
        return `${followUpCtx}Si U aumenta ×${mult}, du/dy también ×${mult}. Nuevo gradiente: ${fmt(newShear, "s⁻¹", 2)}.${newTau != null ? ` τ nuevo: ${fmt(newTau, "Pa", 4)}.` : ""}`;
      }
      return `${followUpCtx}Para un cambio ×${mult}: du/dy = U/h. Si cambias h o U, el gradiente escala en consecuencia.`;
    }

    if (intentType === "formula") return strings.couetteFormula;

    if (intentType === "shear" || intentType === "value") {
      if (shear != null) {
        const parts = [
          `• du/dy = ${fmt(shear, "s⁻¹", 2)}`,
          tauCouette != null ? `• τ = ${fmt(tauCouette, "Pa", 4)}` : null,
          reCouette != null ? `• Re = ${fmtNumber(reCouette, 0)}` : null,
        ].filter(Boolean);
        return `Resultado actual:\n${parts.join("\n")}\n${tipsFor("couette")}`;
      }
      return `${strings.couetteNoData} (necesito h y U).`;
    }

    if (intentType === "stress") {
      if (shear != null && mu != null)
        return `τ = μ·du/dy = ${mu}·${shear.toFixed(2)} = ${fmt(
          mu * shear,
          "Pa",
          4,
        )}.`;
      return strings.couetteShear;
    }

    if (intentType === "increase") return strings.couetteIncrease;
    if (intentType === "decrease") return strings.couetteDecrease;
    if (intentType === "validity") return strings.couetteValidity;

    return (
      `${followUpCtx}${strings.fallbackCouette}\n` +
      "Dime si quieres: du/dy, τ o verificación de Re."
    );
  }

  return strings.fallbackGeneric;
}

// ─────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────

const STORAGE_KEY = "fluidlab_assistant_v4";

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or sandbox — fail silently
  }
}

// ─────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────

export const downloadCSV = (
  labName: string,
  data: { [key: string]: number | string }[],
) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `FluidLab_${labName}_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────
// DELTA ICON
// ─────────────────────────────────────────────

function DeltaIcon({ trend, label }: { trend: DeltaTrend; label?: string }) {
  if (trend == null) return null;
  if (trend === "same") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-[var(--color-text-muted)]">
        <Minus size={10} />
        sin cambio
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-black ${
        trend === "up" ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      {trend === "up" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// SIMPLE MARKDOWN RENDERER
// ─────────────────────────────────────────────

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div className="text-[var(--color-text-soft)] leading-relaxed space-y-2 text-sm markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

// ─────────────────────────────────────────────
// WELCOME MESSAGE HELPER
// ─────────────────────────────────────────────

function getWelcomeMessage(context: LabContext): string {
  const strings = I18N.es;
  switch (context) {
    case "poiseuille":
      return strings.welcomePoiseuille;
    case "stokes":
      return strings.welcomeStokes;
    case "couette":
      return strings.welcomeCouette;
    default:
      return strings.fallbackGeneric;
  }
}

// ─────────────────────────────────────────────
// ANALYSIS PANEL COMPONENT
// ─────────────────────────────────────────────

interface AnalysisPanelProps {
  analysis: AnalysisItem[];
}

function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  const strings = I18N.es;

  const toneIcon = (tone: AnalysisTone) => {
    if (tone === "ok")
      return <CheckCircle size={12} className="text-emerald-400" />;
    if (tone === "warn" || tone === "bad") return <TriangleAlert size={12} />;
    return null;
  };

  const toneLabel = (tone: AnalysisTone) => {
    if (tone === "bad") return strings.toneAlert;
    if (tone === "warn") return strings.toneReview;
    return strings.toneInfo;
  };

  return (
    <div className="space-y-2" role="region" aria-label="Análisis automático">
      {analysis.map((a, i) => (
        <div
          key={`a-${i}`}
          className="p-4 rounded-2xl bg-white/5 border border-brand-border/60 text-xs text-[var(--color-text)] space-y-1 assistant-panel"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {toneIcon(a.tone)}
              <p className="font-black tracking-tight">{a.title}</p>
              {a.delta != null && (
                <DeltaIcon trend={a.delta} label={a.deltaLabel} />
              )}
            </div>
            {a.tone !== "ok" && a.tone !== "info" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400 shrink-0">
                <TriangleAlert size={12} />
                {toneLabel(a.tone)}
              </span>
            )}
          </div>
          <p className="text-[var(--color-text-soft)] leading-relaxed">
            {a.body}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// CHAT WINDOW COMPONENT
// ─────────────────────────────────────────────

interface ChatWindowProps {
  chat: ChatMsg[];
  isTyping: boolean;
}

function ChatWindow({ chat, isTyping }: ChatWindowProps) {
  const strings = I18N.es;

  return (
    <div
      className="pt-3 space-y-3 border-t border-brand-border/40"
      role="log"
      aria-live="polite"
      aria-label="Historial del chat"
    >
      {chat.map((m, i) => (
        <div
          key={`${m.role}-${m.timestamp}-${i}`}
          className={`flex gap-3 ${
            m.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            m.role === "user" ? "bg-brand-secondary/20 text-brand-secondary" : "bg-brand-accent/20 text-brand-accent"
          }`}>
            {m.role === "user" ? <span className="text-xs font-bold">Tú</span> : <MessageCircle size={16} />}
          </div>
          <div
            className={`p-4 rounded-2xl border text-sm leading-relaxed max-w-[85%] ${
              m.role === "user" ? "assistant-bubble-user rounded-tr-sm" : "assistant-bubble-ai rounded-tl-sm"
            }`}
          >
            {m.role === "assistant" ? (
              <SimpleMarkdown text={m.text} />
            ) : (
              <p className="text-[var(--color-text-soft)]">{m.text}</p>
            )}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 flex-row"
            role="status"
            aria-label={strings.typing}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-accent/20 text-brand-accent">
              <MessageCircle size={16} />
            </div>
            <div className="p-4 rounded-2xl border border-brand-border bg-black/20 text-xs flex items-center gap-2 text-[var(--color-text-muted)] assistant-bubble assistant-bubble-ai rounded-tl-sm">
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-brand-accent rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-brand-accent rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-brand-accent rounded-full"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {strings.typing}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// QUICK PROMPTS COMPONENT
// ─────────────────────────────────────────────

interface QuickPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled: boolean;
}

function QuickPrompts({ prompts, onSelect, disabled }: QuickPromptsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Preguntas rápidas"
    >
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-brand-border text-[10px] font-bold text-[var(--color-text)] hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed assistant-prompt"
          title={disabled ? "Espera a que termine la respuesta actual" : p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface AIAssistantProps {
  input: HeuristicInput;
}

export const AIAssistant = ({ input }: AIAssistantProps) => {
  const { unitSystem } = useContext(UnitContext);
  const strings = I18N.es;

  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);

  // Delta tracking
  const prevInputRef = useRef<HeuristicInput>(input);
  const [prevInput, setPrevInput] = useState<HeuristicInput | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Refs for latest state
  const chatRef = useRef(chat);
  chatRef.current = chat;

  // Persistence
  const storageReady = useRef(false);

  useEffect(() => {
    const saved = loadState();
    if (saved.open != null) setOpen(saved.open);
    if (saved.chat) setChat(saved.chat);
    storageReady.current = true;
  }, []);

  useEffect(() => {
    if (!storageReady.current) return;
    saveState({ open, chat });
  }, [open, chat]);

  // Delta tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevInput(prevInputRef.current);
      prevInputRef.current = input;
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  // Welcome message
  useEffect(() => {
    if (!open) return;

    if (chat.length === 0 && !welcomeSent) {
      const welcomeMsg: ChatMsg = {
        role: "assistant",
        text: "Hola, soy tu asistente de FluidLab. ¿En qué te puedo ayudar hoy?",
        timestamp: Date.now(),
      };

      setChat([welcomeMsg]);
      setWelcomeSent(true);
    }
  }, [open, chat, welcomeSent]);

  const derived = useMemo(
    () => ({ ...input }),
    [input],
  );

  const analysis = useMemo(
    () => analysisFor(derived, unitSystem, prevInput),
    [derived, unitSystem, prevInput],
  );

  const cfg = LAB_CONFIG[input.labContext];

  // Unread count
  const readCountRef = useRef<number>(0);

  useEffect(() => {
    if (open) {
      readCountRef.current = chat.length;
    }
  }, [open, chat.length]);

  const unreadCount = !open
    ? Math.max(0, chat.length - readCountRef.current)
    : 0;

  // Auto-scroll
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [open, chat]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Send message
  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || isTyping) return;

      const userMsg: ChatMsg = { role: "user", text: q, timestamp: Date.now() };

      const historyWithUser = [
        ...chatRef.current,
        userMsg,
      ];

      setChat(historyWithUser);
      setDraft("");
      setIsTyping(true);

      setTimeout(async () => {
        try {
          let reply = "";
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const systemInstruction = `Eres un asistente experto en mecánica de fluidos para la aplicación FluidLab.
El usuario está actualmente en el laboratorio: ${input.labContext}.
Los parámetros actuales del laboratorio son: ${JSON.stringify(derived)}.
Sistema de unidades actual: ${unitSystem}.
Responde de manera concisa, educativa y directamente relacionada con la mecánica de fluidos.
Si el usuario hace una pregunta general, responde basándote en los principios de la física.
Si la pregunta es sobre los parámetros actuales, usa los valores proporcionados.`;

            // Format history for context (last 5 messages to save tokens)
            const recentHistory = historyWithUser.slice(-5).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.text}`).join('\n');
            const prompt = `Historial reciente:\n${recentHistory}\n\nPregunta actual del usuario: ${q}`;

            const response = await ai.models.generateContent({
              model: "gemini-3.1-pro-preview",
              contents: prompt,
              config: {
                systemInstruction,
              }
            });
            reply = response.text || "";
          } catch (apiError) {
            console.error("Gemini API Error, falling back to local NLP:", apiError);
            reply = answerQuestionV2(
              q,
              derived,
              unitSystem,
              historyWithUser,
            );
          }

          if (!reply) {
             reply = answerQuestionV2(q, derived, unitSystem, historyWithUser);
          }

          const assistantMsg: ChatMsg = {
            role: "assistant",
            text: reply,
            timestamp: Date.now(),
          };
          setChat((prev) => [...prev, assistantMsg]);
        } catch {
          const errorMsg: ChatMsg = {
            role: "assistant",
            text: strings.errorProcessing,
            timestamp: Date.now(),
          };
          setChat((prev) => [...prev, errorMsg]);
        } finally {
          setIsTyping(false);
        }
      }, 0);
    },
    [input.labContext, derived, unitSystem, isTyping, strings.errorProcessing],
  );

  // External event bus
  useEffect(() => {
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{
        open?: boolean;
        prompt?: string;
      }>;
      const detail = ce.detail ?? {};
      if (detail.open) setOpen(true);
      if (typeof detail.prompt === "string" && detail.prompt.trim())
        setTimeout(() => send(detail.prompt as string), 0);
    };
    window.addEventListener("fluidlab:assistant", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fluidlab:assistant",
        handler as EventListener,
      );
  }, [send]);

  const clearChat = () => {
    setChat([]);
    setWelcomeSent(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-[min(92vw,28rem)] glass-card rounded-3xl overflow-hidden border-brand-accent/30 shadow-2xl shadow-black/30 assistant-shell"
            role="dialog"
            aria-label={strings.title}
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-5 border-b border-brand-border flex items-start justify-between gap-4 assistant-header">
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-secondary flex items-center justify-center text-brand-bg shadow-lg assistant-avatar"
                  aria-hidden="true"
                >
                  <MessageCircle size={16} />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-widest">
                    {strings.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={clearChat}
                      disabled={chat.length === 0}
                      className="p-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text)] hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-white/5 assistant-ghost"
                      title={strings.clearChat}
                      aria-label={strings.clearChat}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors assistant-ghost"
                title={strings.close}
                aria-label={strings.close}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick prompts */}
            <div className="px-5 pt-4 space-y-3">
              <QuickPrompts
                prompts={cfg.quickPrompts}
                onSelect={send}
                disabled={isTyping}
              />
            </div>

            {/* Analysis + Chat */}
            <div
              ref={listRef}
              className="p-5 space-y-3 max-h-[22rem] overflow-y-auto assistant-scroll"
            >
              <AnalysisPanel analysis={analysis} />

              {chat.length > 0 && (
                <ChatWindow chat={chat} isTyping={isTyping} />
              )}
            </div>

            {/* Input */}
            <div className="px-5 pb-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
                className="flex items-center gap-2"
                aria-label="Enviar pregunta al asistente"
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={strings.inputPlaceholder}
                  disabled={isTyping}
                  aria-label="Escribe tu pregunta"
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-brand-border text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-brand-accent/60 disabled:opacity-50 transition-colors text-xs assistant-input"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isTyping}
                  className="px-4 py-3 rounded-2xl bg-brand-accent text-brand-bg font-black border border-black/10 hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:scale-100 assistant-send"
                  title="Enviar pregunta"
                  aria-label="Enviar pregunta"
                >
                  {isTyping ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <SendHorizontal size={18} aria-hidden="true" />
                  )}
                </button>
              </form>
              <p className="mt-3 text-[9px] text-[var(--color-text-muted)] font-mono uppercase tracking-widest">
                {strings.footer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        className="w-14 h-14 rounded-2xl bg-brand-accent text-brand-bg flex items-center justify-center shadow-2xl shadow-brand-accent/30 relative border border-black/10 assistant-fab"
        title={open ? strings.close : strings.open}
        aria-label={open ? strings.close : strings.open}
        aria-expanded={open}
      >
        <span className="assistant-fab-ring" aria-hidden="true" />
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {!open && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-brand-card)] text-brand-accent text-[8px] font-black flex items-center justify-center border border-brand-border"
            aria-label={`${unreadCount} ${strings.newMessages}`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};
