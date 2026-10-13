import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { categoriesQuery, productsQuery, type Product } from "@/lib/menu";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDialog } from "@/components/site/ProductDialog";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Order Online — KRUNCH HOUR Menu" },
      { name: "description", content: "Browse pizza, chicken burgers, fries, pasta, wraps and cold drinks. Customize and order online." },
      { property: "og:title", content: "KRUNCH HOUR Menu" },
      { property: "og:description", content: "Customize and order online for delivery or pickup." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [], isLoading, error } = useQuery(productsQuery);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Product | null>(null);
  const cart = useCart();

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.categories?.slug === category) &&
        (!term || p.name.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term)),
    );
  }, [products, category, q]);

  return (
    <>
      <PageHero title="Order Online" subtitle="Pick your favourites, customize, and check out in under a minute." />
      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur md:top-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search menu" placeholder="Search menu…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
            <Chip active={!category} onClick={() => navigate({ search: {} })}>All</Chip>
            {cats.map((c) => (
              <Chip key={c.id} active={category === c.slug} onClick={() => navigate({ search: { category: c.slug } })}>{c.name}</Chip>
            ))}
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-10">
        {error && <p className="text-destructive">Couldn't load the menu. Please refresh.</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />)}
          {list.map((p) => <ProductCard key={p.id} product={p} onSelect={setSel} />)}
        </div>
        {!isLoading && list.length === 0 && <p className="py-16 text-center text-muted-foreground">No items match your search.</p>}
      </section>
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <Link to="/cart" className="flex w-full max-w-md items-center justify-between rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground shadow-card">
            <span>View cart · {cart.count} items</span>
            <span>{formatPKR(cart.subtotal)}</span>
          </Link>
        </div>
      )}
      <ProductDialog product={sel} onClose={() => setSel(null)} />
    </>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
