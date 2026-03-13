import { TheorySection } from "./components/TheorySection";
import { SolvedExercises } from "./components/SolvedExercises";
import { InteractiveCalculators } from "./components/InteractiveCalculators";
import { VirtualLabs } from "./components/VirtualLabs";
import { CitationSection } from "./components/CitationSection";
import { motion, useScroll, useSpring } from "motion/react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  ChevronRight,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Globe, Download } from "lucide-react";
import { UnitContext, UnitSystem } from "./context/UnitContext";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    return (localStorage.getItem("unitSystem") as UnitSystem) || "SI";
  });

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();

    // Safari fallback: addListener/removeListener
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("unitSystem", unitSystem);
  }, [unitSystem]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const toggleUnitSystem = () =>
    setUnitSystem((prev) => (prev === "SI" ? "USCS" : "SI"));

  const exportSession = () => {
    const sessionData: Record<string, any> = {};
    const keys = ["theme", "unitSystem", "pParams", "sParams", "cParams"];
    keys.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val) sessionData[key] = val.startsWith("{") ? JSON.parse(val) : val;
    });

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FluidLab_Session_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-[var(--color-text)] selection:bg-brand-accent/30 selection:text-black transition-colors duration-300 app-shell">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-accent z-[60] origin-left shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full glass-card border-none bg-brand-bg/40 backdrop-blur-xl border-b border-white/5 nav-shell">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 h-16 lg:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent border border-brand-accent/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Activity size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tighter text-lg lg:text-xl leading-none text-[var(--color-text)]">
                FLUID<span className="text-brand-accent">LAB</span>
              </span>
              <span className="text-[9px] lg:text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
                by: JeanCol
              </span>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleUnitSystem}
              className="p-2 rounded-xl glass-card border-brand-accent/30 text-brand-accent"
              title="Cambiar sistema de unidades"
              aria-label="Cambiar sistema de unidades"
            >
              <Globe size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass-card border-brand-accent/30 text-brand-accent"
              title="Alternar modo"
              aria-label="Alternar modo"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            <a
              href="#theory"
              className="hover:text-brand-accent transition-all flex items-center gap-2 group"
            >
              <span className="w-1 h-1 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Teoría
            </a>
            <a
              href="#exercises"
              className="hover:text-brand-accent transition-all flex items-center gap-2 group"
            >
              <span className="w-1 h-1 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Ejercicios
            </a>
            <a
              href="#calculators"
              className="hover:text-brand-accent transition-all flex items-center gap-2 group"
            >
              <span className="w-1 h-1 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Calculadoras
            </a>
            <a
              href="#labs"
              className="px-5 py-2 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent hover:text-black transition-all font-black"
            >
              Laboratorios
            </a>

            <button
              onClick={exportSession}
              className="px-4 py-2 rounded-xl bg-white/5 border border-brand-border text-[var(--color-text)] hover:bg-white/10 transition-all text-[10px] font-black tracking-widest flex items-center gap-2"
              title="Exportar Configuración Actual"
            >
              <Download size={14} />
              EXPORTAR SESIÓN
            </button>

            <button
              onClick={toggleUnitSystem}
              className="px-4 py-2 rounded-xl glass-card border-brand-accent/30 text-brand-accent hover:scale-105 transition-all text-[10px] font-black tracking-widest flex items-center gap-2"
              title="Cambiar Sistema de Unidades"
              aria-label="Cambiar sistema de unidades"
            >
              <Globe size={14} />
              {unitSystem === "SI" ? "SISTEMA SI" : "SISTEMA USCS"}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 ml-4 rounded-xl glass-card border-brand-accent/30 text-brand-accent hover:scale-110 transition-all"
              title="Alternar Modo"
              aria-label="Alternar modo"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-bg/50 to-brand-bg"></div>

        {/* Animated Background Elements */}
        {reduceMotion ? (
          <>
            <div className="absolute top-1/4 -left-20 w-[30rem] h-[30rem] bg-brand-accent/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-brand-secondary/10 rounded-full blur-[120px]" />
          </>
        ) : (
          <>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/4 -left-20 w-[30rem] h-[30rem] bg-brand-accent/10 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-brand-secondary/10 rounded-full blur-[120px]"
            />
          </>
        )}

        <div className="max-w-screen-xl mx-auto px-6 text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-card text-brand-accent text-[11px] font-bold uppercase tracking-[0.2em] border-brand-accent/20"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping"></div>
            Industrial Excellence Edition
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-8xl md:text-[10rem] font-black tracking-tighter leading-[0.8] text-[var(--color-text)]"
            >
              DINÁMICA DE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-emerald-400 to-brand-secondary">
                FLUIDOS
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="max-w-3xl mx-auto text-2xl text-[var(--color-text-muted)] font-light leading-relaxed"
            >
              Arquitectura técnica para el análisis masivo de viscosidad,
              regímenes de flujo e ingeniería de transporte en entornos de alto
              rendimiento.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-8"
          >
            <a
              href="#labs"
              className="px-10 py-5 bg-brand-accent text-black font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-3 group shadow-2xl shadow-brand-accent/30 text-lg cta-primary"
            >
              Ejecutar Laboratorio
              <ChevronRight
                size={24}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#theory"
              className="px-10 py-5 glass-card font-bold rounded-2xl hover:bg-white/5 transition-all text-[var(--color-text)] border-white/10 uppercase tracking-[0.2em] text-xs btn-secondary"
            >
              Documentación Técnica
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-7 h-12 border-2 border-white/10 rounded-full flex justify-center p-2 scroll-indicator"
        >
          <div className="w-1.5 h-3 bg-brand-accent rounded-full shadow-[0_0_12px_rgba(16,185,129,1)] scroll-indicator-dot"></div>
        </motion.div>
      </header>

      <UnitContext.Provider value={{ unitSystem, setUnitSystem }}>
        <main className="max-w-screen-2xl mx-auto px-6 lg:px-12 space-y-32">
          <TheorySection />
          <SolvedExercises />
          <InteractiveCalculators />
          <VirtualLabs />
          <CitationSection />
        </main>
      </UnitContext.Provider>

      {/* Footer / Contact */}
      <footer className="py-24 bg-[rgba(0,0,0,0.05)] border-t border-brand-border">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Activity size={22} />
            </div>
            <span className="font-bold tracking-tighter text-2xl text-[var(--color-text)]">
              FLUIDLAB
            </span>
          </div>
          <p className="text-[var(--color-text-muted)] text-base">
            Ingeniería de Fluidos v3.14 - Suite de Simulación Avanzada.
          </p>
          <div className="flex gap-8 text-[var(--color-text-muted)] text-xs uppercase tracking-widest font-black">
            <a href="#" className="hover:text-brand-accent transition-colors">
              Github
            </a>
            <a href="#" className="hover:text-brand-accent transition-colors">
              Academy
            </a>
            <a href="#" className="hover:text-brand-accent transition-colors">
              Technical Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
