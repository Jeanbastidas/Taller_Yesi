import { BlockMath, InlineMath } from "react-katex";
import {
  Layers,
  Wind,
  Droplets,
  Info,
  Users,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useContext, useMemo, useState } from "react";
import { UnitContext } from "../context/UnitContext";
import { getUnits } from "../utils/units";

// Reusable variable table component
const VarTable = ({
  vars,
}: {
  vars: { sym: string; desc: string; unit: string }[];
}) => (
  <div className="overflow-x-auto rounded-2xl border border-brand-border/40">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-brand-border/40 bg-white/5">
          <th className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
            Símbolo
          </th>
          <th className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
            Descripción
          </th>
          <th className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
            Unidad SI
          </th>
        </tr>
      </thead>
      <tbody>
        {vars.map((v, i) => (
          <tr
            key={i}
            className={`border-b border-brand-border/20 ${i % 2 === 0 ? "bg-black/10" : ""}`}
          >
            <td className="px-4 py-2 font-mono text-brand-accent font-bold">
              {v.sym}
            </td>
            <td className="px-4 py-2 text-slate-400">{v.desc}</td>
            <td className="px-4 py-2 font-mono text-slate-500">{v.unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Figure caption component
const FigCaption = ({
  caption,
  source,
}: {
  caption: string;
  source?: string;
}) => (
  <p className="text-center text-[9px] text-slate-500 font-medium mt-2 italic">
    <span className="text-brand-accent/60">Fig.</span> {caption}
    {source && (
      <>
        {" "}
        — <span className="text-slate-600">Fuente: {source}</span>
      </>
    )}
  </p>
);

// ── Newton Viscosity Law Chart (SVG diagram, fiel a la imagen original) ──
const NewtonViscosityChart = () => (
  <svg
    width="100%"
    viewBox="0 0 500 420"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <defs>
      <marker
        id="nv-arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path
          d="M2 1L8 5L2 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </marker>
    </defs>

    {/* Grid lines — subtle */}
    <g stroke="rgba(148,163,184,0.12)" strokeWidth="0.6">
      {[60, 100, 140, 180, 220, 260, 300].map((y) => (
        <line key={`h${y}`} x1="70" y1={y} x2="450" y2={y} />
      ))}
      {[110, 155, 200, 245, 290, 335, 380, 425].map((x) => (
        <line key={`v${x}`} x1={x} y1="40" x2={x} y2="340" />
      ))}
    </g>

    {/* Y axis */}
    <line
      x1="70"
      y1="340"
      x2="70"
      y2="26"
      stroke="currentColor"
      strokeWidth="1.6"
      markerEnd="url(#nv-arrow)"
    />

    {/* X axis */}
    <line
      x1="70"
      y1="340"
      x2="466"
      y2="340"
      stroke="currentColor"
      strokeWidth="1.6"
      markerEnd="url(#nv-arrow)"
    />

    {/* Origin label */}
    <text
      x="56"
      y="352"
      textAnchor="middle"
      fontSize="14"
      fill="currentColor"
      opacity="0.65"
    >
      0
    </text>

    {/* Y axis label: τ (italic, larger) */}
    <text
      x="52"
      y="34"
      textAnchor="middle"
      fontSize="22"
      fontStyle="italic"
      fill="currentColor"
      opacity="0.9"
    >
      τ
    </text>

    {/* X axis label: ∂u/∂y|y as stacked fraction */}
    <text
      x="464"
      y="331"
      textAnchor="start"
      fontSize="14"
      fontStyle="italic"
      fill="currentColor"
      opacity="0.9"
    >
      ∂u
    </text>
    <line
      x1="463"
      y1="335"
      x2="481"
      y2="335"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.75"
    />
    <text
      x="464"
      y="349"
      textAnchor="start"
      fontSize="14"
      fontStyle="italic"
      fill="currentColor"
      opacity="0.9"
    >
      ∂y
    </text>
    <text
      x="483"
      y="349"
      textAnchor="start"
      fontSize="14"
      fontStyle="italic"
      fill="currentColor"
      opacity="0.9"
    >
      |y
    </text>

    {/* The linear line from origin (70,340) to top-right (430, 52) */}
    <line
      x1="70"
      y1="340"
      x2="430"
      y2="52"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity="0.88"
    />

    {/* Dashed leader from midpoint of line to label */}
    <line
      x1="268"
      y1="206"
      x2="315"
      y2="168"
      stroke="rgba(96,165,250,0.55)"
      strokeWidth="0.9"
      strokeDasharray="3 3"
    />
    <circle cx="268" cy="206" r="3.5" fill="rgba(96,165,250,0.5)" />

    {/* Label: pendiente = μ */}
    <text
      x="320"
      y="165"
      textAnchor="start"
      fontSize="14"
      fontStyle="italic"
      fill="#60a5fa"
    >
      pendiente = μ
    </text>
  </svg>
);

export const TheorySection = () => {
  const { unitSystem } = useContext(UnitContext);
  const units = useMemo(() => getUnits(unitSystem), [unitSystem]);
  const [hoveredForce, setHoveredForce] = useState<string | null>(null);

  return (
    <section id="theory" className="space-y-32 py-32">
      {/* Authors Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-12 rounded-3xl border-brand-accent/20 max-w-screen-md mx-auto text-center space-y-6"
      >
        <div className="flex justify-center gap-2 text-brand-accent mb-2">
          <Users size={20} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
            Autores del Proyecto
          </span>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          Taller: Dinámica de Fluidos Viscosos y Fenómenos de Transporte
        </h3>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)] font-medium">
          <span>Ali Valle</span>
          <span>Andres Chacon</span>
          <span>Cassiannil Hernandez</span>
          <span>Isabella Charris</span>
          <span>Yesireth Corro</span>
        </div>
      </motion.div>

      {/* Workshop Brief */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="glass-card p-10 rounded-3xl border-brand-border/50 max-w-screen-lg mx-auto space-y-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              PUNTO 1
            </p>
            <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
              Objetivo general
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
            <Info size={22} />
          </div>
        </div>

        <p className="text-slate-300 leading-relaxed">
          Analizar el papel de la viscosidad en el movimiento de fluidos,
          identificar regímenes de flujo mediante el número de Reynolds, aplicar
          la ecuación de Poiseuille en conductos y modelar la sedimentación de
          partículas con la ley de Stokes, integrando teoría, resolución de
          problemas y una implementación web didáctica.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-black/30 border border-white/5 p-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Resultados de aprendizaje
            </p>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
              <li>Explicar físicamente la viscosidad y diferenciar μ y ν.</li>
              <li>Calcular e interpretar Re en distintos escenarios.</li>
              <li>Aplicar Poiseuille para caudal y caída de presión.</li>
              <li>Aplicar Stokes y validar su rango (Re bajo).</li>
              <li>Comunicar resultados con rigor (unidades y supuestos).</li>
              <li>Construir un recurso web con contenido y laboratorios.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-black/30 border border-white/5 p-6 space-y-3 lg:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Instrucciones generales
            </p>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
              <li>Trabajo en grupos (o individual, según se indique).</li>
              <li>
                Formato informe: portada, introducción, desarrollo,
                conclusiones, referencias.
              </li>
              <li>
                Toda ecuación incluye significado de variables y unidades SI.
              </li>
              <li>
                En cada ejercicio: datos → modelo → despeje → cálculo →
                verificación → interpretación.
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-brand-accent/5 border border-brand-accent/20 p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
            Punto 2: Entregable
          </p>
          <p className="text-xs text-slate-300">
            Página web académica + laboratorios virtuales. Debe contener:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-black/30 border border-white/5 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                A. Sección teórica
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                <li>Explicación conceptual clara (texto propio).</li>
                <li>Ecuaciones legibles con render matemático.</li>
                <li>Tabla breve de variables con unidades.</li>
                <li>Figuras con pie y referencia si no son propias.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/5 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                B. Ejercicios resueltos
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                <li>Al menos 3 ejercicios resueltos.</li>
                <li>Datos, desarrollo y resultado.</li>
                <li>Verificación dimensional y unidades.</li>
                <li>Interpretación física final.</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent border border-brand-accent/30">
            <span className="font-black text-xs">P1</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-[var(--color-text)]">
            Parte 1: Fundamentación Teórica
          </h2>
        </div>

        {/* ── 1.1 Viscosidad ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-bold uppercase tracking-widest">
              <Droplets size={12} />
              1.1 Naturaleza de la Viscosidad
            </div>

            <p className="text-slate-300 leading-relaxed text-base">
              La{" "}
              <strong className="text-[var(--color-text)]">viscosidad</strong>{" "}
              es la propiedad de los fluidos que mide su resistencia interna a
              la deformación por esfuerzo cortante. Surge de las fuerzas
              intermoleculares entre capas adyacentes en movimiento relativo
              (fricción laminar).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="glass-card p-6 rounded-2xl border-brand-border/50 space-y-4">
                <h4 className="text-brand-accent font-bold text-sm tracking-widest">
                  Viscosidad Dinámica <span className="normal-case">(μ)</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La viscosidad dinámica, representada por la letra griega{" "}
                  <strong className="text-[var(--color-text)]">μ</strong>, mide
                  directamente la resistencia del fluido al flujo cuando se
                  aplica un esfuerzo cortante. Se define mediante la ley de
                  Newton de la viscosidad:
                </p>
                <div className="py-2">
                  <BlockMath
                    math={
                      "\\tau = \\mu \\left(\\frac{\\partial u}{\\partial y}\\right)"
                    }
                  />
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                    Donde
                  </p>
                  <ul className="text-xs text-[var(--color-text)] space-y-1 list-disc pl-4">
                    <li>τ = esfuerzo cortante (Pa o N/m²)</li>
                    <li>μ = viscosidad dinámica (Pa·s)</li>
                    <li>
                      ∂u/∂y = gradiente de velocidad perpendicular al flujo
                      (s⁻¹)
                    </li>
                  </ul>
                  <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    Unidad (SI): Pa·s = kg/(m·s) · Unidad {unitSystem}:{" "}
                    {units.M}
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Un fluido con mayor viscosidad presenta mayor resistencia al
                  movimiento. Por ejemplo, la miel tiene mayor viscosidad que el
                  agua.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border-brand-border/50 space-y-4">
                <h4 className="text-brand-secondary font-bold text-sm tracking-widest">
                  Viscosidad Cinemática <span className="normal-case">(ν)</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La viscosidad cinemática, representada por la letra griega{" "}
                  <strong className="text-[var(--color-text)]">ν</strong>,
                  relaciona la viscosidad dinámica con la densidad del fluido.
                  Se define como:
                </p>
                <div className="py-2">
                  <BlockMath math={"\\nu = \\frac{\\mu}{\\rho}"} />
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                    Donde
                  </p>
                  <ul className="text-xs text-[var(--color-text)] space-y-1 list-disc pl-4">
                    <li>ν = viscosidad cinemática (m²/s)</li>
                    <li>μ = viscosidad dinámica (Pa·s)</li>
                    <li>ρ = densidad del fluido (kg/m³)</li>
                  </ul>
                  <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    Unidad (SI): m²/s · Unidad {unitSystem}: {units.L}
                    <sup>2</sup>/s
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta propiedad describe cómo se difunde el momento dentro del
                  fluido.
                </p>
              </div>
            </div>

            {/* Variable Table */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Tabla de Variables — Viscosidad
              </p>
              <VarTable
                vars={[
                  { sym: "τ", desc: "Esfuerzo cortante", unit: "Pa (N/m²)" },
                  {
                    sym: "μ",
                    desc: "Viscosidad dinámica",
                    unit: "Pa·s (kg/m·s)",
                  },
                  { sym: "ν", desc: "Viscosidad cinemática", unit: "m²/s" },
                  {
                    sym: "∂u/∂y",
                    desc: "Gradiente de velocidad normal al flujo",
                    unit: "s⁻¹",
                  },
                  { sym: "ρ", desc: "Densidad del fluido", unit: "kg/m³" },
                ]}
              />
            </div>
          </motion.div>

          {/* ── Figura: Diagrama SVG Ley de Newton de la Viscosidad ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-3"
          >
            <div className="relative glass-card rounded-[2.5rem] p-8 border-brand-border/50 overflow-hidden">
              <p className="text-center text-sm font-bold text-[var(--color-text)] mb-4 tracking-wide">
                Ley de Newton de la Viscosidad
              </p>
              <NewtonViscosityChart />
            </div>
            <FigCaption
              caption="Ley de Newton de la Viscosidad — la relación lineal entre τ y ∂u/∂y define un fluido newtoniano; la pendiente de la recta es la viscosidad dinámica μ."
              source="Elaboración propia"
            />
          </motion.div>
        </div>

        {/* ── 1.2 Flujo de Couette ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-[10px] font-bold uppercase tracking-widest">
              <Layers size={12} />
              1.2 Flujo de Couette
            </div>

            <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text)] leading-tight">
              FLUJO DE
              <br />
              <span className="text-brand-secondary">COUETTE</span>
            </h2>

            <p className="text-slate-300 leading-relaxed text-base">
              Flujo laminar entre dos placas paralelas: una fija y otra que se
              desplaza con velocidad constante <InlineMath math="U" />. La
              viscosidad transmite el movimiento entre capas generando un{" "}
              <strong className="text-[var(--color-text)]">
                perfil de velocidades lineal
              </strong>
              .
            </p>

            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-brand-secondary space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Perfil de Velocidades
              </h4>
              <div className="py-2">
                <BlockMath math={"u(y) = U \\left(\\frac{y}{h}\\right)"} />
              </div>
              <p className="text-xs text-slate-500">
                Donde <InlineMath math="u(y)" /> es la velocidad a altura{" "}
                <InlineMath math="y" />, <InlineMath math="U" /> es la velocidad
                de la placa superior y <InlineMath math="h" /> la separación
                entre placas.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Tabla de Variables — Couette
              </p>
              <VarTable
                vars={[
                  {
                    sym: "u(y)",
                    desc: "Velocidad del fluido a altura y",
                    unit: "m/s",
                  },
                  {
                    sym: "U",
                    desc: "Velocidad de la placa superior (móvil)",
                    unit: "m/s",
                  },
                  {
                    sym: "y",
                    desc: "Coordenada perpendicular a las placas",
                    unit: "m",
                  },
                  {
                    sym: "h",
                    desc: "Separación entre las dos placas",
                    unit: "m",
                  },
                  {
                    sym: "τ",
                    desc: "Esfuerzo cortante (constante en Couette)",
                    unit: "Pa",
                  },
                ]}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1 space-y-3"
          >
            <div className="glass-card rounded-[2.5rem] p-1 border-brand-border/50 overflow-hidden">
              <div className="bg-black/40 rounded-[2.4rem] p-10 aspect-video flex flex-col justify-between relative">
                <div className="h-2 w-full bg-slate-800 rounded-full" />
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="absolute left-0 h-full w-px bg-slate-700" />
                  <div className="space-y-4 w-full">
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${v * 80}%` }}
                          className="h-1 bg-brand-secondary rounded-full relative"
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rotate-45 border-t-2 border-r-2 border-brand-secondary" />
                        </motion.div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute left-0 bottom-0 w-full h-full pointer-events-none">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1="0"
                        y1="100"
                        x2="80"
                        y2="0"
                        stroke="rgba(0,210,255,0.25)"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                    </svg>
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-2 w-full bg-brand-secondary rounded-full shadow-[0_0_15px_rgba(0,210,255,0.4)]"
                />
                <div className="absolute top-4 right-10 text-[9px] font-bold text-brand-secondary uppercase tracking-widest">
                  Placa Móvil (U)
                </div>
                <div className="absolute bottom-4 right-10 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Placa Fija
                </div>
              </div>
            </div>
            <FigCaption
              caption="Flujo de Couette: perfil de velocidades lineal entre placa fija (inferior) y placa móvil (superior). Los vectores horizontales representan u(y) = U·(y/h)."
              source="Elaboración propia"
            />
          </motion.div>
        </div>

        {/* ── 1.3 Reynolds & Poiseuille ── */}
        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text)]">
              REGÍMENES Y <span className="text-brand-accent">CAUDALES</span>
            </h2>
            <p className="text-slate-400">
              Análisis del Número de Reynolds y la Ecuación de Poiseuille para
              flujos internos en conductos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reynolds */}
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-card p-10 rounded-[2.5rem] border-brand-border/50 space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Wind size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    1.3
                  </p>
                  <h3 className="text-xl font-bold text-[var(--color-text)]">
                    Número de Reynolds (Re)
                  </h3>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                Parámetro adimensional que relaciona las{" "}
                <strong className="text-[var(--color-text)]">
                  fuerzas inerciales
                </strong>{" "}
                con las{" "}
                <strong className="text-[var(--color-text)]">
                  fuerzas viscosas
                </strong>
                . Determina el tipo de régimen sin resolver las ecuaciones de
                Navier-Stokes:
              </p>

              <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                <BlockMath
                  math={"Re = \\frac{\\rho V D}{\\mu} = \\frac{V D}{\\nu}"}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Tabla de Variables
                </p>
                <VarTable
                  vars={[
                    { sym: "ρ", desc: "Densidad del fluido", unit: "kg/m³" },
                    {
                      sym: "V",
                      desc: "Velocidad media del flujo",
                      unit: "m/s",
                    },
                    {
                      sym: "D",
                      desc: "Diámetro característico del conducto",
                      unit: "m",
                    },
                    { sym: "μ", desc: "Viscosidad dinámica", unit: "Pa·s" },
                    {
                      sym: "ν",
                      desc: "Viscosidad cinemática (μ/ρ)",
                      unit: "m²/s",
                    },
                  ]}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">
                    Laminar
                  </p>
                  <p className="text-xs font-mono text-slate-300 mt-1">
                    Re &lt; 2300
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">
                    Transición
                  </p>
                  <p className="text-xs font-mono text-slate-300 mt-1">
                    2300 – 4000
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                  <p className="text-[10px] font-bold text-rose-400 uppercase">
                    Turbulento
                  </p>
                  <p className="text-xs font-mono text-slate-300 mt-1">
                    Re &gt; 4000
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Poiseuille */}
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-card p-10 rounded-[2.5rem] border-brand-border/50 space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                  <Wind size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    1.4
                  </p>
                  <h3 className="text-xl font-bold text-[var(--color-text)]">
                    Ecuación de Poiseuille
                  </h3>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                Describe el flujo laminar completamente desarrollado en un
                conducto cilíndrico. El caudal es proporcional a{" "}
                <InlineMath math="r^4" /> — pequeños cambios en radio producen{" "}
                <strong className="text-[var(--color-text)]">
                  grandes cambios en caudal
                </strong>
                .
              </p>

              <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                <BlockMath math={"Q = \\frac{\\pi r^4 \\Delta P}{8 \\mu L}"} />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Tabla de Variables
                </p>
                <VarTable
                  vars={[
                    { sym: "Q", desc: "Caudal volumétrico", unit: "m³/s" },
                    {
                      sym: "r",
                      desc: "Radio interior del conducto",
                      unit: "m",
                    },
                    {
                      sym: "ΔP",
                      desc: "Diferencia de presión extremo a extremo",
                      unit: "Pa",
                    },
                    {
                      sym: "μ",
                      desc: "Viscosidad dinámica del fluido",
                      unit: "Pa·s",
                    },
                    { sym: "L", desc: "Longitud del conducto", unit: "m" },
                  ]}
                />
              </div>

              <div className="p-4 rounded-xl bg-brand-secondary/5 border border-brand-secondary/20">
                <p className="text-xs text-slate-300 italic">
                  Sensibilidad al radio: si r se duplica, Q aumenta{" "}
                  <strong>16× (factor 2⁴)</strong>. Esto hace que el radio sea
                  el parámetro de control dominante.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── 1.5 Stokes + DCL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-bold uppercase tracking-widest">
              <ArrowDown size={12} />
              1.5 Ley de Stokes y Velocidad Terminal
            </div>

            <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text)] leading-tight">
              LEY DE
              <br />
              <span className="text-brand-accent">STOKES</span>
            </h2>

            <p className="text-slate-300 leading-relaxed text-base">
              Describe la fuerza de arrastre viscoso sobre una{" "}
              <strong className="text-[var(--color-text)]">
                esfera sólida
              </strong>{" "}
              que se mueve lentamente en un fluido. La partícula alcanza
              velocidad terminal cuando la resultante de fuerzas es cero: peso =
              empuje + arrastre.
            </p>

            <div className="glass-card p-6 rounded-2xl border-brand-border/50 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Velocidad Terminal (Vt)
              </h4>
              <div className="py-2">
                <BlockMath
                  math={"v_t = \\frac{2 r^2 (\\rho_p - \\rho_f) g}{9 \\mu}"}
                />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">
                  Condición de validez
                </p>
                <p className="text-xs text-slate-400">
                  La ley de Stokes es válida únicamente cuando{" "}
                  <InlineMath math="Re_p = \frac{\rho_f v_t d}{\mu} \ll 1" />{" "}
                  (flujo reptante). Para <InlineMath math="Re_p > 1" /> se debe
                  usar la correlación de Schiller-Naumann.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Tabla de Variables — Stokes
              </p>
              <VarTable
                vars={[
                  {
                    sym: "vt",
                    desc: "Velocidad terminal de sedimentación",
                    unit: "m/s",
                  },
                  {
                    sym: "r",
                    desc: "Radio de la partícula esférica",
                    unit: "m",
                  },
                  {
                    sym: "ρp",
                    desc: "Densidad de la partícula",
                    unit: "kg/m³",
                  },
                  { sym: "ρf", desc: "Densidad del fluido", unit: "kg/m³" },
                  { sym: "g", desc: "Aceleración gravitacional", unit: "m/s²" },
                  {
                    sym: "μ",
                    desc: "Viscosidad dinámica del fluido",
                    unit: "Pa·s",
                  },
                  {
                    sym: "Reₚ",
                    desc: "Reynolds de partícula (criterio validez)",
                    unit: "adim.",
                  },
                ]}
              />
            </div>
          </motion.div>

          {/* DCL animado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="glass-card rounded-[3rem] p-12 border-brand-accent/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Info size={120} />
              </div>
              <h3 className="text-xl font-bold mb-10 flex items-center gap-3 text-[var(--color-text)]">
                Diagrama de Cuerpo Libre
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-normal">
                  (DCL)
                </span>
              </h3>

              <div className="flex flex-col items-center gap-10">
                <div className="relative w-64 h-80 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -15, 0], opacity: [0.1, 0.35, 0.1] }}
                        transition={{
                          duration: 4 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.4,
                        }}
                        className="absolute w-full h-1 bg-brand-accent/40 blur-sm"
                        style={{ top: `${i * 12.5}%` }}
                      />
                    ))}
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    {/* Forces up */}
                    <div className="absolute -top-28 flex flex-col items-center gap-1">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        onMouseEnter={() => setHoveredForce("Fb")}
                        onMouseLeave={() => setHoveredForce(null)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-secondary/30 shadow-sm">
                          <ArrowUp className="text-brand-secondary" size={18} />
                          <span className="text-[10px] font-bold text-brand-secondary">
                            Fb (Empuje)
                          </span>
                        </div>
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.3, repeat: Infinity }}
                        onMouseEnter={() => setHoveredForce("Fd")}
                        onMouseLeave={() => setHoveredForce(null)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-500/30 shadow-sm">
                          <ArrowUp className="text-amber-500" size={24} />
                          <span className="text-[10px] font-bold text-amber-500">
                            Fd (Arrastre)
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Particle */}
                    <motion.div
                      animate={{ y: [0, 2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-800 border-2 border-white dark:border-slate-300 shadow-xl flex items-center justify-center"
                      onMouseEnter={() => setHoveredForce("particle")}
                      onMouseLeave={() => setHoveredForce(null)}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="w-3 h-3 rounded-full bg-white/40 dark:bg-slate-400/40" />
                    </motion.div>

                    {/* Weight down */}
                    <div className="absolute -bottom-24 flex flex-col items-center">
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        onMouseEnter={() => setHoveredForce("Fg")}
                        onMouseLeave={() => setHoveredForce(null)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm px-3 py-1 rounded-full border border-rose-500/30 shadow-sm">
                          <ArrowDown className="text-rose-500" size={36} />
                          <span className="text-[10px] font-bold text-rose-500">
                            Fg (Peso)
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Equilibrium */}
                <div className="w-full glass-card p-6 rounded-2xl space-y-3">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] text-center">
                    Condición de Equilibrio (Vt)
                  </p>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-rose-500 font-mono font-bold text-xl">
                      Fg
                    </span>
                    <span className="text-slate-400 font-bold">=</span>
                    <span className="text-brand-secondary font-mono font-bold text-xl">
                      Fb
                    </span>
                    <span className="text-slate-400 font-bold">+</span>
                    <span className="text-amber-500 font-mono font-bold text-xl">
                      Fd
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    <InlineMath math="\frac{4}{3}\pi r^3 \rho_p g = \frac{4}{3}\pi r^3 \rho_f g + 6\pi\mu r v_t" />
                  </p>
                </div>

                {/* Tooltip */}
                {hoveredForce && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full glass-card p-4 rounded-2xl text-center"
                  >
                    {hoveredForce === "Fg" && (
                      <div>
                        <p className="text-sm font-bold text-rose-500">
                          Fuerza de Gravedad (Fg)
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          <InlineMath math="F_g = m g = \frac{4}{3} \pi r^3 \rho_p g" />
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Actúa hacia abajo debido al peso de la partícula.
                        </p>
                      </div>
                    )}
                    {hoveredForce === "Fb" && (
                      <div>
                        <p className="text-sm font-bold text-brand-secondary">
                          Fuerza de Empuje (Fb)
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          <InlineMath math="F_b = m_f g = \frac{4}{3} \pi r^3 \rho_f g" />
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Principio de Arquímedes: empuje hacia arriba del
                          fluido.
                        </p>
                      </div>
                    )}
                    {hoveredForce === "Fd" && (
                      <div>
                        <p className="text-sm font-bold text-amber-500">
                          Fuerza de Arrastre (Fd)
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          <InlineMath math="F_d = 6 \pi \mu r v" />
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Ley de Stokes: resistencia viscosa del fluido.
                        </p>
                      </div>
                    )}
                    {hoveredForce === "particle" && (
                      <div>
                        <p className="text-sm font-bold text-slate-600">
                          Partícula Esférica
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Radio r, densidad ρ_p, masa m = (4/3)πr³ρ_p
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          En sedimentación libre, alcanza velocidad terminal Vt.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
            <FigCaption
              caption="DCL de partícula esférica en sedimentación: Fg (peso), Fb (empuje de Arquímedes) y Fd (fuerza de Stokes). En Vt la aceleración neta es cero."
              source="Elaboración propia"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
