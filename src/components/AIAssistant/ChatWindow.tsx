import { useState } from "react";
import { MessageCircle, Copy, Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ChatMsg } from "./types";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface Props {
  chat: ChatMsg[];
  isTyping: boolean;
}

export function ChatWindow({ chat, isTyping }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="pt-4 space-y-6 border-t border-brand-border/30"
      role="log"
      aria-live="polite"
      aria-label="Historial del chat"
    >
      <AnimatePresence mode="popLayout">
        {chat.map((m, i) => (
          <motion.div
            key={`${m.role}-${m.timestamp}-${i}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              m.role === "user" ? "bg-brand-secondary/20 text-brand-secondary" : "bg-brand-accent/20 text-brand-accent assistant-avatar"
            }`}>
              {m.role === "user" ? <span className="text-[8px] font-black uppercase">Tú</span> : <MessageCircle size={14} />}
            </div>
            <div
              className={`group relative assistant-bubble ${
                m.role === "user" ? "assistant-bubble-user" : "assistant-bubble-ai"
              }`}
            >
              {m.role === "assistant" && (
                <button
                  onClick={() => copyToClipboard(m.text, i)}
                  className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-brand-card border border-brand-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5 text-[var(--color-text-muted)] shadow-md"
                  title="Copiar respuesta"
                >
                  {copiedIndex === i ? <Check size={12} className="text-brand-accent" /> : <Copy size={12} />}
                </button>
              )}
              {m.role === "assistant" ? (
                <SimpleMarkdown text={m.text} />
              ) : (
                <p className="font-medium text-sm">{m.text}</p>
              )}
              <div className="mt-2 flex items-center justify-end gap-1 opacity-30 text-[8px] font-mono uppercase tracking-tighter">
                <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-3 flex-row"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-brand-accent/20 text-brand-accent assistant-avatar">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="assistant-bubble assistant-bubble-ai flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest neon-text">IA Pensando...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
