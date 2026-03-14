import { HeuristicInput, Intent, ChatMsg, LabContext, AnalysisItem } from "./types";
import { I18N } from "./constants";
import { getUnits } from "../../utils/units";
import { UnitSystem } from "../../context/UnitContext";

export function detectIntent(q: string, lab: LabContext): Intent {
  const low = q.toLowerCase();

  // Hypothetical / Sensitivity
  if (
    low.includes("si ") ||
    low.includes("qué pasa") ||
    low.includes("cambio") ||
    low.includes("duplico") ||
    low.includes("triplico") ||
    low.includes("mitad")
  ) {
    let multiplier = 2;
    if (low.includes("triplico")) multiplier = 3;
    if (low.includes("mitad") || low.includes("50%")) multiplier = 0.5;

    let param = "unknown";
    if (low.includes("radio") || low.includes("r ")) param = "radius";
    if (low.includes("presión") || low.includes("p ")) param = "dp";
    if (low.includes("viscosidad") || low.includes("mu") || low.includes("μ"))
      param = "mu";
    if (low.includes("longitud") || low.includes("l ")) param = "l";
    if (low.includes("separación") || low.includes(" h ")) param = "h";
    if (low.includes("velocidad") || low.includes(" u ")) param = "uTop";

    return { type: "hypothetical", param, multiplier, rawQuestion: q };
  }

  // Formula
  if (low.includes("fórmula") || low.includes("ecuación") || low.includes("ley"))
    return { type: "formula", rawQuestion: q };

  // Validity
  if (
    low.includes("válido") ||
    low.includes("límite") ||
    low.includes("reynolds") ||
    low.includes("laminar")
  )
    return { type: "validity", rawQuestion: q };

  // Values
  if (
    low.includes("cuánto") ||
    low.includes("valor") ||
    low.includes("resultado") ||
    low.includes("actual")
  )
    return { type: "value", rawQuestion: q };

  // Increase/Decrease
  if (low.includes("aumentar") || low.includes("subir") || low.includes("más"))
    return { type: "increase", rawQuestion: q };
  if (low.includes("disminuir") || low.includes("bajar") || low.includes("menos"))
    return { type: "decrease", rawQuestion: q };

  // Stress/Shear
  if (
    low.includes("esfuerzo") ||
    low.includes("cortante") ||
    low.includes("tau") ||
    low.includes("τ")
  )
    return { type: "stress", rawQuestion: q };

  return { type: "fallback", rawQuestion: q };
}

export function answerQuestionV2(
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
    const { qValue, radius, dp, l, mu, rep } = input;

    if (intent.type === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && radius != null && qValue != null) {
        const newR = radius * mult;
        const newQ = qValue * Math.pow(mult, 4);
        const factor = Math.pow(mult, 4).toFixed(1);
        return `${followUpCtx}Si el radio cambia de ${radius.toExponential(2)} m a ${newR.toExponential(2)} m (×${mult}), Q aumenta ×${factor} (r⁴). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "dp" && qValue != null) {
        const newQ = qValue * mult;
        return `${followUpCtx}Si ΔP se multiplica ×${mult}, Q también se multiplica ×${mult} (relación lineal). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "mu" && qValue != null) {
        const newQ = qValue / mult;
        return `${followUpCtx}Si μ aumenta ×${mult}, Q disminuye ×${mult} (Q ∝ 1/μ). Nuevo Q estimado: ${newQ.toExponential(3)} ${units.Q}.`;
      }
      if (param === "l" && qValue != null) {
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
      if (Number.isFinite(rep)) {
        const reNum = rep!;
        return reNum < 2100
          ? `Re = ${reNum.toFixed(0)} → flujo laminar. Poiseuille es válido.`
          : `Re = ${reNum.toFixed(0)} → ${reNum < 4000 ? "transición" : "turbulento"}. Poiseuille NO aplica.`;
      }
      return strings.poiseuilleValidity;
    }

    if (intent.type === "stress") {
      if (radius != null && dp != null && l != null) {
        const tauMax = (radius * dp) / (2 * l);
        return `Esfuerzo cortante máximo en la pared: τ_w = r·ΔP/(2L) = ${tauMax.toFixed(4)} Pa. En el centro del tubo τ = 0.`;
      }
      return strings.poiseuilleStress;
    }

    return `${followUpCtx}${strings.fallbackPoiseuille}`;
  }

  // ── STOKES ──
  if (input.labContext === "stokes") {
    const { vt, rep, mu, radius } = input;

    if (intent.type === "hypothetical") {
      const mult = intent.multiplier ?? 2;
      const param = intent.param;
      if (param === "radius" && radius != null && vt != null) {
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
      if (Number.isFinite(vt) && mu != null && radius != null) {
        const fd = 6 * Math.PI * mu * radius * vt!;
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

export function analyzeInput(input: HeuristicInput): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  if (input.labContext === "poiseuille") {
    const { rep, radius, dp } = input;
    if (rep != null) {
      if (rep > 2100) {
        items.push({
          title: "Flujo Turbulento",
          body: `Re = ${rep.toFixed(0)} supera el límite laminar (2100). La ley de Poiseuille no es exacta aquí.`,
          tone: "error",
        });
      } else if (rep > 1500) {
        items.push({
          title: "Zona de Transición",
          body: "El flujo se acerca a la turbulencia. Los resultados pueden variar.",
          tone: "warn",
        });
      } else {
        items.push({
          title: "Flujo Estable",
          body: "Régimen laminar confirmado. Los cálculos son altamente precisos.",
          tone: "ok",
        });
      }
    }
    if (radius != null && radius < 1e-4) {
      items.push({
        title: "Capilaridad Extrema",
        body: "El radio es muy pequeño. Efectos de tensión superficial podrían ser relevantes.",
        tone: "info",
      });
    }
  }

  if (input.labContext === "stokes") {
    const { rep } = input;
    if (rep != null) {
      if (rep > 1) {
        items.push({
          title: "Fuera de Rango Stokes",
          body: `Re_p = ${rep.toFixed(2)} > 1. Las fuerzas de inercia son significativas. La ley de Stokes subestima el arrastre.`,
          tone: "error",
        });
      } else if (rep > 0.1) {
        items.push({
          title: "Corrección Necesaria",
          body: "Re_p > 0.1. Considera usar la corrección de Oseen para mayor precisión.",
          tone: "warn",
        });
      } else {
        items.push({
          title: "Régimen de Stokes",
          body: "Flujo reptante confirmado. La ley es perfectamente aplicable.",
          tone: "ok",
        });
      }
    }
  }

  if (input.labContext === "couette") {
    const { h, uTop } = input;
    if (h != null && uTop != null && h > 0) {
      const shear = uTop / h;
      if (shear > 1000) {
        items.push({
          title: "Alto Cizallamiento",
          body: `Gradiente de ${shear.toFixed(0)} s⁻¹. Verifica si el fluido es no-newtoniano.`,
          tone: "warn",
        });
      }
    }
  }

  return items;
}

export const downloadCSV = (
  labName: string,
  data: Array<Record<string, any>>,
) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => row[h]).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `FluidLab_${labName}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
