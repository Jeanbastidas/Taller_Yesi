import { useState, useContext, useMemo } from 'react';
import { UnitContext } from '../context/UnitContext';
import { getConv, getUnits } from '../utils/units';
import { Activity, FlaskConical, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { BlockMath } from 'react-katex';

export const InteractiveCalculators = () => {
  const { unitSystem } = useContext(UnitContext);
  const conv = useMemo(() => getConv(unitSystem), [unitSystem]);
  const units = useMemo(() => getUnits(unitSystem), [unitSystem]);

  // ── Calculator 1: Reynolds ──────────────────────────────────────────────────
  const [reInputs, setReInputs] = useState({ rho: 1000, v: 1, d: 0.05, mu: 0.001 });
  const reValue = (reInputs.rho * reInputs.v * reInputs.d) / reInputs.mu;

  const getRegime = (re: number) => {
    if (re < 2300) return { label: 'LAMINAR', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (re < 4000) return { label: 'TRANSICIÓN', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { label: 'TURBULENTO', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };
  const regime = getRegime(reValue);

  // ── Calculator 2: Poiseuille ─────────────────────────────────────────────────
  const [pInputs, setPInputs] = useState({ r: 0.01, mu: 0.2, dp: 255000, l: 50 });
  const qValue = (Math.PI * Math.pow(pInputs.r, 4) * pInputs.dp) / (8 * pInputs.mu * pInputs.l);

  // ── Calculator 3: Stokes ──────────────────────────────────────────────────────
  const [sInputs, setSInputs] = useState({ r: 0.025, rhoP: 2650, rhoF: 1000, mu: 0.001, g: 9.81 });
  const vtValue = (2 * Math.pow(sInputs.r, 2) * (sInputs.rhoP - sInputs.rhoF) * sInputs.g) / (9 * sInputs.mu);
  const rep = (sInputs.rhoF * vtValue * 2 * sInputs.r) / sInputs.mu;
  const stokesValid = rep < 1;

  return (
    <section id="calculators" className="py-32 space-y-16">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent border border-brand-accent/30">
            <span className="font-black text-xs">P3</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--color-text)]">
            Punto 3: Motores de <span className="text-brand-accent">Cálculo</span>
          </h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Calculadoras interactivas — ingresa los valores en SI y obtén resultados al instante con validación de régimen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Reynolds Calculator ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group border-brand-border/50"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculadora 01</p>
              <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">Número de Reynolds</h3>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
            <BlockMath math={"Re = \\frac{\\rho \\cdot V \\cdot D}{\\mu}"} />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Densidad ρ', unit: 'kg/m³', key: 'rho', step: 10 },
              { label: 'Velocidad V', unit: 'm/s', key: 'v', step: 0.1 },
              { label: 'Diámetro D', unit: 'm', key: 'd', step: 0.001 },
              { label: 'Viscosidad μ', unit: 'Pa·s', key: 'mu', step: 0.0001 },
            ].map(input => (
              <div key={input.key} className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-28 shrink-0">
                  {input.label} <span className="opacity-50">({input.unit})</span>
                </label>
                <input
                  type="number"
                  step={input.step}
                  value={reInputs[input.key as keyof typeof reInputs]}
                  onChange={e => setReInputs({ ...reInputs, [input.key]: Number(e.target.value) })}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[var(--color-text)] font-mono text-xs focus:border-brand-accent outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <motion.div
            layout
            className={`p-5 rounded-2xl border ${regime.border} ${regime.bg} flex flex-col items-center justify-center space-y-2`}
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Resultado</span>
            <span className="text-3xl font-mono font-black text-[var(--color-text)] tracking-tighter">
              Re = {reValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${regime.border} ${regime.color} bg-black/20`}>
              {regime.label}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Poiseuille Calculator ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group border-brand-border/50"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-secondary/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary border border-brand-secondary/20">
              <FlaskConical size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculadora 02</p>
              <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">Poiseuille — Caudal</h3>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
            <BlockMath math={"Q = \\frac{\\pi r^4 \\Delta P}{8 \\mu L}"} />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Radio r', unit: 'm', key: 'r', step: 0.001 },
              { label: 'Viscosidad μ', unit: 'Pa·s', key: 'mu', step: 0.001 },
              { label: 'Presión ΔP', unit: 'Pa', key: 'dp', step: 1000 },
              { label: 'Longitud L', unit: 'm', key: 'l', step: 1 },
            ].map(input => (
              <div key={input.key} className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-28 shrink-0">
                  {input.label} <span className="opacity-50">({input.unit})</span>
                </label>
                <input
                  type="number"
                  step={input.step}
                  value={pInputs[input.key as keyof typeof pInputs]}
                  onChange={e => setPInputs({ ...pInputs, [input.key]: Number(e.target.value) })}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[var(--color-text)] font-mono text-xs focus:border-brand-secondary outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/20 flex flex-col items-center justify-center space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Caudal Q</span>
            <p className="text-3xl font-mono font-black text-brand-secondary tracking-tighter">
              {conv.Q(qValue).toExponential(3)}
            </p>
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">{units.Q}</span>
          </div>
        </motion.div>

        {/* ── Stokes Calculator ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group border-brand-border/50"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000" />

          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
              <ArrowDown size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculadora 03</p>
              <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">Velocidad Terminal</h3>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
            <BlockMath math={"v_t = \\frac{2 r^2 (\\rho_p - \\rho_f) g}{9 \\mu}"} />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Radio r', unit: 'm', key: 'r', step: 0.001 },
              { label: 'Densidad ρp', unit: 'kg/m³', key: 'rhoP', step: 10 },
              { label: 'Densidad ρf', unit: 'kg/m³', key: 'rhoF', step: 10 },
              { label: 'Viscosidad μ', unit: 'Pa·s', key: 'mu', step: 0.0001 },
            ].map(input => (
              <div key={input.key} className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-28 shrink-0">
                  {input.label} <span className="opacity-50">({input.unit})</span>
                </label>
                <input
                  type="number"
                  step={input.step}
                  value={sInputs[input.key as keyof typeof sInputs]}
                  onChange={e => setSInputs({ ...sInputs, [input.key]: Number(e.target.value) })}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[var(--color-text)] font-mono text-xs focus:border-brand-accent outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 flex flex-col items-center space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Velocidad Terminal Vt</span>
            <p className="text-3xl font-mono font-black text-brand-accent tracking-tighter">
              {conv.V(vtValue).toFixed(2)}
            </p>
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">{units.V}</span>
            <div className={`mt-1 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
              stokesValid
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                : 'text-rose-400 border-rose-500/30 bg-rose-500/5'
            }`}>
              Reₚ = {rep.toFixed(3)} — Ley de Stokes {stokesValid ? '✓ Válida' : '⚠ Fuera de rango'}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
