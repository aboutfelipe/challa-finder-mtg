import { useEffect, useRef, useState } from "react";
import { Search, XCircle } from "lucide-react";
 

interface CardSearchFormProps {
  onSearch: (cardName: string) => void;
  isLoading: boolean;
}

export const CardSearchForm = ({ onSearch, isLoading }: CardSearchFormProps) => {
  const [cardName, setCardName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [focused, setFocused] = useState(false);
  const [suppress, setSuppress] = useState(false); // keep dropdown closed after search until typing
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    // Hide suggestions and submit search
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
    inputRef.current?.blur();
    setFocused(false);
    setSuppress(true);
    onSearch(cardName.trim());
  };

  // Fetch suggestions (debounced)
  useEffect(() => {
    if (isLoading) return; // don't fetch while searching
    const q = cardName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setHighlight(-1);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Autocomplete error");
        const data = (await res.json()) as { data?: string[] };
        const items = data.data ?? [];
        const top = items.slice(0, 10);
        setSuggestions(top);
        setOpen(top.length > 0 && focused && !suppress);
        setHighlight(-1);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setSuggestions([]);
        setOpen(false);
        setHighlight(-1);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [cardName, isLoading]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlight >= 0 && highlight < suggestions.length) {
        e.preventDefault();
        const pick = suggestions[highlight];
        setCardName(pick);
        setOpen(false);
        setSuggestions([]);
        setHighlight(-1);
        inputRef.current?.blur();
        setFocused(false);
        setSuppress(true);
        onSearch(pick);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  };

  const selectSuggestion = (name: string) => {
    setCardName(name);
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
    inputRef.current?.blur();
    setFocused(false);
    setSuppress(true);
    onSearch(name);
  };

  // Close on outside click
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">MTG Challa Finder</div>
        <p className="text-sm text-gray-600 max-w-md mx-auto mt-1">Buscamos en las mejores tiendas de Chile especializadas en Magic The Gathering</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative" ref={containerRef}>
          <input
            type="text"
            placeholder="Ejemplo: Lightning Bolt, Jace..."
            value={cardName}
            onChange={(e) => { setCardName(e.target.value); setSuppress(false); }}
            onFocus={() => { setFocused(true); if (suggestions.length > 0 && !suppress) setOpen(true); }}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(() => { setOpen(false); setHighlight(-1); setFocused(false); }, 120)}
            ref={inputRef}
            className="w-full pl-12 pr-12 py-4 text-base bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-0 transition-all duration-200 shadow-sm"
            disabled={isLoading}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

          {cardName.trim().length > 0 && (
            <button
              type="button"
              aria-label="Limpiar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setCardName("");
                setSuggestions([]);
                setOpen(false);
                setHighlight(-1);
                setSuppress(false);
                inputRef.current?.focus();
              }}
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto">
              {suggestions.map((name, idx) => (
                <li
                  key={name}
                  onMouseDown={(e) => {
                    // prevent blur before click
                    e.preventDefault();
                    selectSuggestion(name);
                  }}
                  className={[
                    "px-3 py-2 cursor-pointer text-sm",
                    idx === highlight ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-800",
                  ].join(" ")}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !cardName.trim()}
          className="w-full py-4 text-base font-semibold bg-gray-900 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Buscando en tiendas...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Carta
            </div>
          )}
        </button>
      </form>
    </div>
  );
};