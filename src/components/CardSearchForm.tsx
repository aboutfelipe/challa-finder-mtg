import { useState } from "react";
import { Search } from "lucide-react";
 

interface CardSearchFormProps {
  onSearch: (cardName: string) => void;
  isLoading: boolean;
}

export const CardSearchForm = ({ onSearch, isLoading }: CardSearchFormProps) => {
  const [cardName, setCardName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    onSearch(cardName.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">MTG Challa Finder</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Ejemplo: Lightning Bolt, Jace..."
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-base bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-0 transition-all duration-200 shadow-sm"
            disabled={isLoading}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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