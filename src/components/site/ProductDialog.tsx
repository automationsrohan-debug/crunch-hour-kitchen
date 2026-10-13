import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addonsQuery, type Product } from "@/lib/menu";
import { productImage } from "@/lib/images";
import { formatPKR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function ProductDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { data: allAddons = [] } = useQuery(addonsQuery);
  const cart = useCart();
  const [variationId, setVariationId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setVariationId(product?.product_variations[0]?.id ?? null);
    setAddonIds([]);
    setQty(1);
    setNotes("");
  }, [product]);

  const addons = useMemo(() => (product ? allAddons.filter((a) => a.category_id === product.category_id) : []), [allAddons, product]);
  if (!product) return null;
  const variation = product.product_variations.find((v) => v.id === variationId) ?? null;
  const chosen = addons.filter((a) => addonIds.includes(a.id));
  const unit = (variation ? Number(variation.price) : Number(product.base_price)) + chosen.reduce((s, a) => s + Number(a.price), 0);
  const img = productImage(product.image_key, product.categories?.slug);

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        <img src={img} alt={product.name} className="h-56 w-full object-cover" />
        <div className="space-y-5 p-6 pt-2">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
            <DialogDescription>{product.description}</DialogDescription>
          </DialogHeader>

          {product.product_variations.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Choose size</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.product_variations.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={variationId === v.id}
                    onClick={() => setVariationId(v.id)}
                    className={cn(
                      "rounded-2xl border-2 px-3 py-2 text-left text-sm transition",
                      variationId === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-primary">{formatPKR(v.price)}</div>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {addons.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Add-ons (optional)</legend>
              <div className="space-y-2">
                {addons.map((a) => {
                  const on = addonIds.includes(a.id);
                  return (
                    <label key={a.id} className={cn("flex cursor-pointer items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm", on ? "border-accent bg-accent/15" : "border-border")}>
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--primary)]"
                          checked={on}
                          onChange={() => setAddonIds(on ? addonIds.filter((x) => x !== a.id) : [...addonIds, a.id])}
                        />
                        {a.name}
                      </span>
                      <span className="font-semibold">+{formatPKR(a.price)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="item-notes" className="mb-2 block text-sm font-bold">Special request</label>
            <Textarea id="item-notes" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. less spicy, no onions" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border-2 border-border">
              <button type="button" aria-label="Decrease quantity" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" className="p-3" onClick={() => setQty(Math.min(50, qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <Button
              variant="maroon"
              size="lg"
              className="flex-1"
              onClick={() => {
                cart.add({
                  product_id: product.id,
                  name: product.name,
                  image: img,
                  variation_id: variation?.id ?? null,
                  variation_name: variation?.name ?? null,
                  addons: chosen.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
                  unit_price: unit,
                  quantity: qty,
                  notes: notes.trim() || undefined,
                });
                toast.success(`${product.name} added to cart`);
                onClose();
              }}
            >
              Add · {formatPKR(unit * qty)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
