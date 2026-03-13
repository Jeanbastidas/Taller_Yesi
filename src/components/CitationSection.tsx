import { motion } from "motion/react";
import { Github, FileText, ShieldCheck, Cpu } from "lucide-react";

export const CitationSection = () => {
  return (
    <footer className="py-24 border-t border-brand-border mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
              <Cpu size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Technical <span className="text-brand-accent">Stack</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Arquitectura moderna diseñada para la visualización científica y el
            aprendizaje interactivo de alto rendimiento.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "React 19",
              "Vite",
              "Tailwind 4",
              "Motion",
              "Recharts",
              "KaTeX",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 glass-card rounded-3xl border-brand-border/50 space-y-4"
          >
            <div className="flex items-center gap-3 text-brand-secondary">
              <ShieldCheck size={20} />
              <h3 className="font-bold uppercase tracking-widest text-xs">
                Verificación Académica
              </h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Todas las ecuaciones físicas, constantes y lógicas de cálculo
              (Reynolds, Poiseuille, Stokes) han sido verificadas y corregidas
              manualmente para asegurar su precisión académica.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 glass-card rounded-3xl border-brand-border/50 space-y-4"
          >
            <div className="flex items-center gap-3 text-brand-accent">
              <FileText size={20} />
              <h3 className="font-bold uppercase tracking-widest text-xs">
                Uso de IA Generativa
              </h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Desarrollado con la asistencia de{" "}
              <span className="text-[var(--color-text)] font-medium">
                Google AI Studio (Gemini 3 Flash)
              </span>{" "}
              para la optimización de la estructura de código y componentes
              interactivos.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
          © 2026 Laboratorio Virtual de Mecánica de Fluidos
        </div>
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="text-slate-500 hover:text-brand-accent transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <Github size={16} />
            Source
          </a>
          <a
            href="#"
            className="text-slate-500 hover:text-brand-accent transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <FileText size={16} />
            License
          </a>
        </div>
      </div>
    </footer>
  );
};
