import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MessageCircle,
  SendHorizontal,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { UnitContext } from "../../context/UnitContext";
import {
  HeuristicInput,
  ChatMsg,
  AnalysisItem,
  LabContext,
} from "./types";
import { I18N } from "./constants";
import { answerQuestionV2, analyzeInput } from "./utils";
import { ChatWindow } from "./ChatWindow";
import { AnalysisPanel } from "./AnalysisPanel";
import { QuickPrompts } from "./QuickPrompts";

interface Props {
  input: HeuristicInput;
  onUpdateParams?: (params: Partial<HeuristicInput>) => void;
}

export function AIAssistant({ input, onUpdateParams }: Props) {
  const { unitSystem } = useContext(UnitContext);
  const strings = I18N.es;

  const [open, setOpen] = useState(() => {
    return localStorage.getItem("assistant_open") === "true";
  });

  const [chat, setChat] = useState<ChatMsg[]>(() => {
    const saved = localStorage.getItem("assistant_chat");
    return saved ? JSON.parse(saved) : [];
  });

  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisItem[] | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef<HeuristicInput>(input);

  const [currentLab, setCurrentLab] = useState<LabContext>(input.labContext);

  // Persistence
  useEffect(() => {
    localStorage.setItem("assistant_open", String(open));
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (input.labContext !== currentLab) {
      setCurrentLab(input.labContext);
    }
  }, [input.labContext, currentLab]);

  useEffect(() => {
    localStorage.setItem("assistant_chat", JSON.stringify(chat));
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  // AI-Powered Live Analysis & Suggestions
  useEffect(() => {
    if (!open) return;
    
    const hasChanged = JSON.stringify(input) !== JSON.stringify(prevInputRef.current);
    if (!hasChanged && aiAnalysis) return;

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Analiza estos datos de laboratorio de fluidos (${currentLab}): ${JSON.stringify(input)}. 
        Genera 2 insights técnicos breves y 2 sugerencias de qué preguntar a continuación. 
        Si hay algo que mejorar, incluye una "action" con un "label" y los "params" a cambiar.
        Responde en JSON con formato: { "insights": [{ "title": string, "body": string, "tone": "ok"|"warn"|"error"|"info", "action"?: { "label": string, "params": object } }], "suggestions": [string] }`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        
        const data = JSON.parse(response.text || "{}");
        
        setAiAnalysis(data.insights?.map((i: any) => ({ ...i, isAI: true })) || []);
        setAiSuggestions(data.suggestions || []);
      } catch (e) {
        console.error("AI Analysis failed", e);
        setAiAnalysis(null);
      } finally {
        setIsAnalyzing(false);
        prevInputRef.current = input;
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [input, open, aiAnalysis, currentLab]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: ChatMsg = { role: "user", text, timestamp: Date.now() };
      setChat((prev) => [...prev, userMsg]);
      setDraft("");
      setIsTyping(true);

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const ai = new GoogleGenAI({ apiKey });

        const history = chat.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

        const contextPrompt = `Contexto actual del laboratorio (${currentLab}): ${JSON.stringify(input)}. 
        Responde de forma técnica pero accesible. Usa LaTeX para fórmulas si es necesario (ej: $E=mc^2$).
        Si el usuario pregunta algo que requiere cambiar parámetros, sugiérelo.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [...history, { role: "user", parts: [{ text: `${contextPrompt}\n\nUsuario: ${text}` }] }],
          config: { maxOutputTokens: 800 },
        });
        
        const assistantMsg: ChatMsg = {
          role: "assistant",
          text: response.text || "Lo siento, no pude generar una respuesta.",
          timestamp: Date.now(),
        };
        setChat((prev) => [...prev, assistantMsg]);
      } catch (error) {
        console.error("Gemini Error", error);
        const fallback = answerQuestionV2(text, { ...input, labContext: currentLab }, unitSystem, chat);
        setChat((prev) => [
          ...prev,
          { role: "assistant", text: fallback, timestamp: Date.now() },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [chat, input, isTyping, unitSystem, currentLab],
  );

  const clearChat = () => {
    if (window.confirm("¿Borrar historial?")) {
      setChat([]);
      localStorage.removeItem("assistant_chat");
    }
  };

  // Listen for global events to open assistant with specific context
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.open) setOpen(true);
      if (e.detail?.context) setCurrentLab(e.detail.context);
    };
    window.addEventListener("fluidlab:assistant", handler);
    return () => window.removeEventListener("fluidlab:assistant", handler);
  }, []);

  const combinedAnalysis = useMemo(() => {
    const local = analyzeInput({ ...input, labContext: currentLab });
    return [...(aiAnalysis || []), ...local];
  }, [aiAnalysis, input, currentLab]);

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-secondary text-brand-bg shadow-2xl z-[100] flex items-center justify-center assistant-fab glow-accent"
        aria-label="Abrir asistente de IA"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && combinedAnalysis.some(a => a.tone === 'error' || a.tone === 'warn') && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-bg animate-pulse" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            className="fixed bottom-24 right-6 w-[min(92vw,28rem)] h-[min(80vh,42rem)] glass-card border-brand-border/40 shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-[100] flex flex-col overflow-hidden assistant-shell glow-secondary"
          >
            {/* Header */}
            <div className="p-5 border-b border-brand-border flex items-start justify-between gap-4 assistant-header relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-small opacity-10 pointer-events-none" />
              <div className="flex items-start gap-3 relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-secondary flex items-center justify-center text-brand-bg shadow-lg assistant-avatar"
                  aria-hidden="true"
                >
                  <MessageCircle size={18} />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-widest">
                    {strings.subtitle}
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-[var(--color-text)] leading-none text-editorial">
                    {strings.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-xl hover:bg-white/5 text-[var(--color-text-muted)] transition-colors"
                  title={strings.clearChat}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5 text-[var(--color-text-muted)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide"
            >
              {/* Analysis Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                    Análisis en Vivo
                  </h3>
                  {isAnalyzing && <Loader2 size={12} className="animate-spin text-brand-accent" />}
                </div>
                
                {combinedAnalysis.length > 0 ? (
                  <AnalysisPanel 
                    analysis={combinedAnalysis} 
                    labContext={currentLab}
                    onAction={onUpdateParams}
                  />
                ) : (
                  <p className="text-[11px] text-[var(--color-text-muted)] italic">
                    {strings.noAnalysis}
                  </p>
                )}
              </div>

              {/* Chat Section */}
              <div className="space-y-4">
                <ChatWindow chat={chat} isTyping={isTyping} />
                
                <QuickPrompts 
                  onSelect={send} 
                  disabled={isTyping} 
                  aiSuggestions={aiSuggestions}
                />
              </div>
            </div>

            {/* Input */}
            <div className="p-5 assistant-input-container">
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
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-brand-border text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-brand-accent/60 disabled:opacity-50 transition-all text-xs"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isTyping}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-bg font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 assistant-send"
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
              <p className="mt-3 text-[9px] text-[var(--color-text-muted)] font-mono uppercase tracking-widest opacity-60">
                {strings.footer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
