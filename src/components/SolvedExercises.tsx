import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import { motion, AnimatePresence } from "motion/react";

interface ExerciseProps {
  key?: any;
  title: string;
  statement: string;
  data: string[];
  steps: { label: string; math: string; description: string }[];
  result: string;
  numericResult: number;
  interpretation: string;
  isInteractive: boolean;
}

const Exercise = ({
  title,
  statement,
  data,
  steps,
  result,
  numericResult,
  interpretation,
  isInteractive,
}: ExerciseProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const checkResult = () => {
    const val = parseFloat(userInput.replace(/[^\d.-]/g, ""));
    if (Math.abs(val - numericResult) / numericResult < 0.05) {
      // 5% tolerance
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  return (
    <motion.div
      layout
      className="glass-card self-start rounded-3xl overflow-hidden border-brand-border/50 hover:border-brand-accent/30 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 bg-white/5 hover:bg-white/10 transition-all text-left group"
      >
        <div className="flex items-center gap-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? "bg-brand-accent text-black rotate-90" : "bg-brand-border text-slate-500"}`}
          >
            <FileText size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Caso de Estudio
            </span>
            <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight group-hover:text-brand-accent transition-colors">
              {title}
            </h3>
          </div>
        </div>
        <div
          className={`p-2 rounded-full transition-all duration-500 ${isOpen ? "bg-brand-accent/20 text-brand-accent rotate-180" : "bg-white/5 text-slate-500"}`}
        >
          <ChevronDown size={24} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-8 lg:p-12 space-y-12 border-t border-brand-border">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary uppercase tracking-[0.3em]">
                      <Info size={12} />
                      Enunciado del Problema
                    </div>
                    <p className="text-[var(--color-text)] text-lg md:text-xl font-light leading-relaxed italic border-l-4 border-brand-secondary pl-6">
                      {statement}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-accent uppercase tracking-[0.3em]">
                      <ArrowRight size={12} />
                      Procedimiento Algorítmico
                    </div>
                    <div className="space-y-6">
                      {steps.map((step, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-6 relative group"
                        >
                          <div className="absolute top-0 right-0 p-6 text-4xl font-black text-brand-accent/10 group-hover:text-brand-accent/20 transition-colors">
                            0{i + 1}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Fase de Resolución
                            </span>
                            <h5 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-tight">
                              {step.label}
                            </h5>
                          </div>
                          <div className="py-4 overflow-x-auto">
                            <BlockMath math={step.math} />
                          </div>
                          <p className="text-sm text-slate-400 font-light leading-relaxed">
                            {step.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-[2rem] bg-brand-border/20 border border-brand-border space-y-6">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                      Variables de Entrada
                    </h4>
                    <ul className="space-y-4">
                      {data.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-4 text-sm text-[var(--color-text)]"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 shadow-[0_0_8px_rgba(0,255,157,0.5)]"></div>
                          <span className="font-mono">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`p-8 rounded-[2rem] space-y-6 shadow-[0_20px_40px_rgba(0,255,157,0.15)] relative overflow-hidden group transition-all duration-500 ${
                      isInteractive
                        ? isCorrect === true
                          ? "bg-emerald-500 text-black"
                          : isCorrect === false
                            ? "bg-rose-500 text-white"
                            : "bg-black/30 text-[var(--color-text)] border border-brand-accent/30"
                        : "bg-gradient-to-br from-brand-accent to-brand-secondary text-black"
                    }`}
                  >
                    {isInteractive ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
                            Tu Resultado
                          </h4>
                          {isCorrect === true && <CheckCircle2 size={16} />}
                        </div>
                        <input
                          type="text"
                          placeholder="Ingresa el valor numérico..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl p-4 font-mono font-bold outline-none focus:border-brand-accent transition-all text-xl"
                        />
                        <button
                          onClick={checkResult}
                          className="w-full py-3 bg-brand-accent text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          Verificar Respuesta
                        </button>
                        {isCorrect === false && (
                          <p className="text-[10px] font-bold text-center animate-pulse uppercase">
                            Intenta de nuevo o revisa los pasos
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
                              Resultado Final
                            </h4>
                          </div>
                          <p className="text-4xl font-mono font-black tracking-tighter">
                            {result}
                          </p>
                        </div>
                      </>
                    )}

                    <div
                      className={`relative pt-6 border-t font-medium space-y-2 ${isInteractive ? "border-white/10" : "border-black/10"}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        Interpretación Física
                      </p>
                      <p
                        className={`text-xs ${isInteractive && isCorrect !== true ? "blur-sm" : ""} transition-all duration-700`}
                      >
                        {interpretation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const SolvedExercises = () => {
  const [isInteractiveGlobal, setIsInteractiveGlobal] = useState(false);

  const exercises = [
    {
      title: "Cálculo del Número de Reynolds",
      statement:
        "Determine el régimen de flujo para un fluido que circula por una tubería de 2 cm de diámetro a una velocidad de 1.5 m/s.",
      data: [
        "Densidad (ρ) = 900 kg/m³",
        "Diámetro (D) = 0.02 m",
        "Viscosidad dinámica (μ) = 0.05 Pa·s",
        "Velocidad (V) = 1.5 m/s",
      ],
      steps: [
        {
          label: "Fórmula del número de Reynolds",
          math: "Re = \\frac{\\rho V D}{\\mu}",
          description:
            "Relacionamos las fuerzas inerciales con las fuerzas viscosas.",
        },
        {
          label: "Verificación dimensional",
          math: "\\frac{(\\mathrm{kg/m^3})(\\mathrm{m/s})(\\mathrm{m})}{\\mathrm{Pa\\cdot s}} = 1",
          description: "El número de Reynolds es adimensional.",
        },
        {
          label: "Sustitución de valores",
          math: "Re = \\frac{900 \\cdot 1.5 \\cdot 0.02}{0.05}",
          description:
            "Insertamos los datos experimentales en la ecuación adimensional.",
        },
        {
          label: "Clasificación del régimen",
          math: "Re = 540 < 2300 \\Rightarrow \\text{laminar}",
          description:
            "En tuberías circulares, Re < 2300 indica flujo laminar.",
        },
      ],
      result: "Re = 540",
      numericResult: 540,
      interpretation:
        "Dado que Re = 540 < 2300, el flujo es laminar, moviéndose en capas paralelas ordenadas.",
    },
    {
      title: "Caída de Presión (Ley de Poiseuille)",
      statement:
        "Calcule la caída de presión en un conducto cilíndrico de 50 m de longitud por el que circula un caudal de 0.1 L/s.",
      data: [
        "Viscosidad (μ) = 0.2 Pa·s",
        "Longitud (L) = 50 m",
        "Radio (r) = 0.01 m",
        "Caudal (Q) = 1 \\times 10^{-4} \\text{ m}^3/\\text{s}",
      ],
      steps: [
        {
          label: "Ecuación de Poiseuille",
          math: "\\Delta P = \\frac{8 \\mu L Q}{\\pi r^4}",
          description:
            "Despejamos la diferencia de presión de la relación fundamental de Poiseuille.",
        },
        {
          label: "Verificación dimensional",
          math: "\\frac{(\\mathrm{Pa\\cdot s})(\\mathrm{m})(\\mathrm{m^3/s})}{\\mathrm{m^4}} = \\mathrm{Pa}",
          description: "La unidad de ΔP es Pascal (Pa).",
        },
        {
          label: "Sustitución",
          math: "\\Delta P = \\frac{8 \\cdot 0.2 \\cdot 50 \\cdot 1 \\times 10^{-4}}{3.1416 \\cdot (0.01)^4}",
          description:
            "Notamos la gran influencia del radio elevado a la cuarta potencia.",
        },
        {
          label: "Resultado e interpretación",
          math: "\\Delta P \\approx 2.55\\times 10^{5}\\,\\mathrm{Pa} \\approx 255\\,\\mathrm{kPa}",
          description:
            "Convertimos a kPa para interpretar la magnitud de la presión requerida.",
        },
      ],
      result: "ΔP = 2.55 × 10⁵ Pa",
      numericResult: 255000,
      interpretation:
        "Se requiere una presión de aproximadamente 255 kPa para mantener este caudal a través de la tubería.",
    },
    {
      title: "Velocidad Terminal (Ley de Stokes)",
      statement:
        "Una microesfera de cuarzo (ρp = 2650 kg/m³) de diámetro d = 50 μm cae en agua (ρf = 1000 kg/m³, μ = 1.0×10⁻³ Pa·s). Calcule Vt y verifique si Stokes aplica (Re_p < 1).",
      data: [
        "g = 9.81 m/s²",
        "ρp = 2650 kg/m³",
        "ρf = 1000 kg/m³",
        "d = 50×10⁻⁶ m",
        "μ = 1.0×10⁻³ Pa·s",
      ],
      steps: [
        {
          label: "Modelo (velocidad terminal)",
          math: "V_t = \\frac{g (\\rho_p - \\rho_f) d^2}{18 \\mu}",
          description:
            "Se obtiene del balance de fuerzas (peso, empuje y arrastre) cuando la aceleración es nula.",
        },
        {
          label: "Verificación dimensional",
          math: "\\frac{(\\mathrm{m/s^2})(\\mathrm{kg/m^3})(\\mathrm{m^2})}{\\mathrm{Pa\\cdot s}} = \\mathrm{m/s}",
          description: "La unidad de Vt es velocidad.",
        },
        {
          label: "Cálculo numérico",
          math: "V_t = \\frac{9.81(2650-1000)(50\\times 10^{-6})^2}{18(10^{-3})} \\approx 2.248\\times 10^{-3}\\,\\mathrm{m/s}",
          description: "Sustituimos valores y calculamos Vt.",
        },
        {
          label: "Validez (Reynolds de partícula)",
          math: "Re_p = \\frac{\\rho_f V_t d}{\\mu} \\approx \\frac{(1000)(2.248\\times10^{-3})(50\\times10^{-6})}{10^{-3}} \\approx 0.112 < 1",
          description:
            "Como Re_p < 1, la ley de Stokes es aplicable en este caso.",
        },
      ],
      result: "Vt ≈ 2.25×10⁻³ m/s",
      numericResult: 0.002248125,
      interpretation:
        "La microesfera sedimenta a ~2.25 mm/s. El valor Re_p ≈ 0.11 confirma flujo reptante y validez de la ley de Stokes.",
    },
  ];

  return (
    <section id="exercises" className="py-32 space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary border border-brand-secondary/30">
              <span className="font-black text-xs">P2</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase text-[var(--color-text)]">
              Punto 2: Casos de{" "}
              <span className="text-brand-secondary">Estudio</span>
            </h2>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Análisis detallado de problemas clásicos de ingeniería de fluidos,
            resueltos paso a paso con rigor matemático.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-brand-secondary/10 p-2 rounded-2xl border border-brand-border">
          <button
            onClick={() => setIsInteractiveGlobal(!isInteractiveGlobal)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${isInteractiveGlobal ? "bg-brand-secondary text-black shadow-lg shadow-brand-secondary/20" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            {isInteractiveGlobal
              ? "MODO INTERACTIVO ACTIVO"
              : "ACTIVAR MODO INTERACTIVO"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {exercises.map((ex, i) => (
          <Exercise
            key={i}
            title={ex.title}
            statement={ex.statement}
            data={ex.data}
            steps={ex.steps}
            result={ex.result}
            interpretation={ex.interpretation}
            numericResult={ex.numericResult}
            isInteractive={isInteractiveGlobal}
          />
        ))}
      </div>
    </section>
  );
};
