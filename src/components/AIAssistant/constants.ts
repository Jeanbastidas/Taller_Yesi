export const I18N = {
  es: {
    title: "Asistente de IA",
    subtitle: "Análisis y Soporte en Tiempo Real",
    inputPlaceholder: "Pregunta sobre el experimento...",
    typing: "IA Pensando...",
    footer: "Gemini 3.1 Pro • Análisis de Fluidos",
    noAnalysis: "Ajusta los parámetros para ver el análisis.",
    clearChat: "Limpiar chat",
    copySuccess: "¡Copiado!",
    
    // Poiseuille
    poiseuilleFormula: "La ecuación de Hagen-Poiseuille es: **Q = (π · r⁴ · ΔP) / (8 · μ · L)**. Indica que el caudal es extremadamente sensible al radio (r⁴).",
    poiseuilleNoQ: "No hay caudal medible. Verifica que ΔP > 0 y r > 0.",
    poiseuilleIncrease: "Para aumentar Q: incrementa el radio (r) o la presión (ΔP), o reduce la viscosidad (μ) o la longitud (L).",
    poiseuilleDecrease: "Para reducir Q: disminuye el radio (r) o la presión (ΔP), o usa un fluido más viscoso (μ).",
    poiseuilleValidity: "Poiseuille solo es válido para flujo laminar (Re < 2100) en tuberías circulares.",
    poiseuilleStress: "El esfuerzo cortante máximo ocurre en la pared: τ_w = (r · ΔP) / (2L).",
    fallbackPoiseuille: "Puedo ayudarte con el caudal, Reynolds, validez de la ley o efectos de los parámetros.",

    // Stokes
    stokesFormula: "La ley de Stokes es: **Vt = [2 · r² · (ρp - ρf) · g] / (9 · μ)**. Describe la velocidad terminal de una esfera en un fluido viscoso.",
    stokesValidity: "La ley de Stokes es válida para Re_p < 0.1 (flujo de Stokes).",
    stokesIncrease: "Para aumentar Vt: usa partículas más grandes (r) o más densas, o un fluido menos viscoso (μ).",
    stokesDecrease: "Para reducir Vt: usa partículas más pequeñas o un fluido más viscoso.",
    stokesForce: "La fuerza de arrastre es Fd = 6π · μ · r · Vt.",
    fallbackStokes: "Pregúntame sobre Vt, Re de partícula, fuerza de arrastre o límites de Stokes.",

    // Couette
    couetteFormula: "En flujo de Couette simple: **u(y) = (U · y) / h**. El perfil de velocidad es lineal.",
    couetteNoData: "Define la separación (h) y la velocidad (U) para calcular el gradiente.",
    couetteShear: "El esfuerzo cortante es constante: τ = μ · (U / h).",
    couetteIncrease: "Para aumentar el esfuerzo (τ): aumenta la velocidad (U) o reduce la separación (h).",
    couetteDecrease: "Para reducir el esfuerzo (τ): disminuye la velocidad (U) o aumenta la separación (h).",
    couetteValidity: "Couette asume flujo laminar entre placas infinitas sin gradiente de presión.",
    fallbackCouette: "Puedo explicar el perfil de velocidad, el gradiente de deformación o el esfuerzo cortante.",

    fallbackGeneric: "Soy tu asistente de laboratorio. Pregúntame sobre las fórmulas, los resultados actuales o qué pasaría si cambias algún parámetro.",
  },
};

export const QUICK_PROMPTS = [
  "¿Cuál es la fórmula principal?",
  "¿Cómo puedo aumentar el resultado?",
  "¿Es válido este experimento?",
  "¿Qué pasa si duplico el radio?",
  "Explícame el esfuerzo cortante",
];
