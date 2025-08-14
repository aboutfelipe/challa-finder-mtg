import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { Favorite } from "@/hooks/use-favorites";

export interface FavoritesPanelProps {
  groupedByStore: Record<string, Favorite[]>;
  onRemove: (id: string) => void;
  storeLogos?: Record<string, string>;
  onClose?: () => void;
}

export const FavoritesPanel = ({ groupedByStore, onRemove, storeLogos, onClose }: FavoritesPanelProps) => {
  const total = Object.values(groupedByStore).reduce((a, b) => a + b.length, 0);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (!onClose) return;
    setClosing(true);
    window.setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);
  };

  const containerClass = [
    "fixed z-30",
    // position responsive
    "top-0 left-0 right-0 md:top-2 md:left-auto md:right-3 md:w-[20rem]",
    // size/appearance
    "max-h-[90vh] overflow-auto bg-white/95 backdrop-blur border border-gray-200 rounded-none md:rounded-2xl shadow-xl",
    // animation
    closing
      ? "animate-out duration-200 ease-in fade-out-0 zoom-out-95"
      : "animate-in duration-200 ease-out fade-in-0 zoom-in-95",
  ].join(" ");

  return (
    <div className={containerClass}>
      <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-3 md:px-4 py-2.5 flex items-center">
        <div className="text-sm font-semibold text-gray-900">Favoritos ({total})</div>
        <div className="ml-auto flex items-center gap-1">
          {typeof onClose === 'function' && (
            <button
              aria-label="Cerrar favoritos"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="p-4 text-sm text-gray-600">Aún no tienes favoritos. Marca la estrella en una oferta para guardarla.</div>
      ) : (
        <div className="p-2 space-y-3">
          {Object.entries(groupedByStore).map(([store, items]) => (
            <div key={store} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                {storeLogos?.[store] && (
                  <img src={storeLogos[store]} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                )}
                <div className="text-xs font-semibold text-gray-900">{store}</div>
                <div className="ml-auto text-[10px] text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</div>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map((f) => (
                  <li key={f.id} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                    <button
                      className="flex items-center gap-2 flex-1 text-left group overflow-hidden"
                      onClick={() => {
                        const url = f.productUrl || f.storeUrl;
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <div className="w-8 h-10 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                        {f.imageUrl ? (
                          <img src={f.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-[10px] text-gray-500">MTG</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-medium text-gray-900 truncate group-hover:underline">{f.cardName}</div>
                        <div className="text-[11px] text-gray-600 truncate">{f.condition || 'Condición desconocida'}</div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 whitespace-nowrap mr-2 shrink-0">{f.price || '—'}</div>
                    </button>
                    <button
                      className="p-1.5 rounded-lg border border-transparent text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
                      title="Eliminar de favoritos"
                      onClick={() => onRemove(f.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
