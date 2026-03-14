import { QUICK_PROMPTS } from "./constants";

interface Props {
  onSelect: (p: string) => void;
  disabled?: boolean;
  aiSuggestions?: string[];
}

export function QuickPrompts({ onSelect, disabled, aiSuggestions = [] }: Props) {
  const allPrompts = [...new Set([...aiSuggestions, ...QUICK_PROMPTS])].slice(0, 6);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {allPrompts.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-xl assistant-prompt-btn text-[10px] font-bold text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed"
          title={disabled ? "Espera a que termine la respuesta actual" : p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
