import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  product_id: string;
  name: string;
  image: string;
  variation_id: string | null;
  variation_name: string | null;
  addons: { id: string; name: string; price: number }[];
  unit_price: number; // display estimate only — server recalculates
  quantity: number;
  notes?: string | undefined;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "kh_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartCtx>(() => {
    const keyOf = (l: Omit<CartLine, "key">) =>
      [l.product_id, l.variation_id ?? "", l.addons.map((a) => a.id).sort().join(","), l.notes ?? ""].join("|");
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.unit_price * l.quantity, 0),
      add: (l) =>
        setLines((prev) => {
          const key = keyOf(l);
          const ex = prev.find((p) => p.key === key);
          if (ex) return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(50, p.quantity + l.quantity) } : p));
          return [...prev, { ...l, key }];
        }),
      setQty: (key, q) =>
        setLines((prev) => (q <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(50, q) } : p)))),
      remove: (key) => setLines((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
