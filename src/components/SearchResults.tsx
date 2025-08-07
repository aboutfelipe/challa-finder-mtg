import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, ShoppingCart, AlertCircle } from "lucide-react";

export interface CardResult {
  store: string;
  storeUrl: string;
  cardName: string;
  price?: string;
  inStock: boolean;
  productUrl?: string;
  imageUrl?: string;
  condition?: string;
  set?: string;
}

interface SearchResultsProps {
  results: CardResult[];
  searchTerm: string;
}

export const SearchResults = ({ results, searchTerm }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-card/90 backdrop-blur-md border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
          <p className="text-muted-foreground">
            No se encontró "{searchTerm}" en ninguna de las tiendas consultadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar resultados por tienda
  const groupedByStore = results.reduce((acc, r) => {
    (acc[r.store] = acc[r.store] || []).push(r);
    return acc;
  }, {} as Record<string, CardResult[]>);

  const totalStores = Array.from(new Set(results.map(r => r.store))).length;
  const storesWithStock = Array.from(new Set(results.filter(r => r.inStock).map(r => r.store))).length;

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6" aria-labelledby="results-title">
      <div className="text-center mb-8">
        <h2 id="results-title" className="text-2xl font-bold mb-2">Resultados para "{searchTerm}"</h2>
        <p className="text-muted-foreground">
          {storesWithStock} tienda(s) con stock de {totalStores} consultadas
        </p>
      </div>

      {Object.entries(groupedByStore).map(([storeName, items]) => (
        <Card key={storeName} className="bg-card/90 backdrop-blur-md border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{storeName}</CardTitle>
              <a
                href={items[0].storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Ir a la tienda <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carta</TableHead>
                    <TableHead>Set</TableHead>
                    <TableHead>Condición</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Enlace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items
                    .slice()
                    .sort((a, b) => Number(b.inStock) - Number(a.inStock))
                    .map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-[260px]">
                          <div className="flex items-center gap-3">
                            {r.imageUrl && (
                              <img
                                src={r.imageUrl}
                                alt={`${r.cardName} en ${storeName}`}
                                className="h-12 w-9 object-cover rounded"
                                loading="lazy"
                              />
                            )}
                            <div className="line-clamp-2">{r.cardName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{r.set || '-'}</TableCell>
                        <TableCell>{r.condition || '-'}</TableCell>
                        <TableCell className="font-semibold">{r.price || '-'}</TableCell>
                        <TableCell>
                          <span className={r.inStock ? "text-success" : "text-muted-foreground"}>
                            {r.inStock ? "En stock" : "Sin stock"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {r.productUrl ? (
                            <Button size="sm" className="bg-magic-gradient hover:shadow-glow" asChild>
                              <a href={r.productUrl} target="_blank" rel="noopener noreferrer">
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Ver
                              </a>
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};
