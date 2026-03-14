import { TriangleAlert, ArrowUp, ArrowDown, Minus, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AnalysisItem, Tone, LabContext } from "./types";

interface Props {
  analysis: AnalysisItem[];
  labContext: LabContext;
  onAction?: (params: any) => void;
}

function toneIcon(tone: Tone) {
  switch (tone) {
    case "error":
      return <TriangleAlert size={14} className="text-red-500" />;
    case "warn":
      return <TriangleAlert size={14} className="text-amber-500" />;
    case "info":
      return <Play size={14} className="text-blue-500" />;
    default:
      return <Play size={14} className="text-emerald-500" />;
  }
}

function toneLabel(tone: Tone) {
  switch (tone) {
    case "error":
      return "Crítico";
    case "warn":
      return "Atención";
    case "info":
      return "Nota";
    default:
      return "Óptimo";
  }
}

function DeltaIcon({ trend, label }: { trend: string; label?: string }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
      {trend === "up" ? (
        <ArrowUp size={10} className="text-emerald-500" />
      ) : trend === "down" ? (
        <ArrowDown size={10} className="text-red-500" />
      ) : (
        <Minus size={10} className="text-blue-500" />
      )}
      {label && <span className="text-[8px] font-bold opacity-60">{label}</span>}
    </div>
  );
}

export function AnalysisPanel({ analysis, labContext, onAction }: Props) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {analysis.map((a, i) => (
          <motion.div
            key={`a-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`analysis-card ${a.isAI ? 'border-brand-accent/40 shadow-lg shadow-brand-accent/5' : ''} relative overflow-hidden group`}
          >
            {a.isAI && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-brand-accent/10 border-b border-l border-brand-accent/20 rounded-bl-lg">
                <span className="text-[7px] font-black uppercase tracking-tighter text-brand-accent neon-text">IA Insight</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                {toneIcon(a.tone)}
                <p className="font-bold tracking-tight text-xs">{a.title}</p>
                {a.delta != null && (
                  <DeltaIcon trend={a.delta} label={a.deltaLabel} />
                )}
              </div>
              {a.tone !== "ok" && a.tone !== "info" && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 shrink-0">
                  <TriangleAlert size={10} />
                  {toneLabel(a.tone)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-soft)] leading-relaxed">
              {a.body}
            </p>
            
            {a.action && onAction && (
              <button
                onClick={() => onAction(a.action?.params)}
                className="mt-2 w-full py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-[9px] font-black uppercase tracking-widest text-brand-accent hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <Play size={10} />
                {a.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
