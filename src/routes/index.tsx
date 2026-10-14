import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bike, Clock, Flame, Phone, Store } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery, settingsQuery, type Product } from "@/lib/menu";
import { CATEGORY_IMAGE } from "@/lib/images";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDialog } from "@/components/site/ProductDialog";
import { formatPKR } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KRUNCH HOUR — Order Burgers, Pizza & Fries Online" },
      { name: "description", content: "Crispy chicken burgers, loaded pizzas, fries, pasta and wraps. Order online for delivery or pickup with cash on delivery." },
      { property: "og:title", content: "KRUNCH HOUR — Order Online" },
      { property: "og:description", content: "Crispy burgers, pizzas and more. Delivery or pickup." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: s } = useQuery(settingsQuery);
  const [sel, setSel] = useState<Product | null>(null);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-maroon-deep text-cream">
        <img src={hero} alt="Crispy chicken burger, fries, pizza and a cold drink" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="max-w-xl animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-semibold text-gold">
              <Flame className="h-4 w-4" /> Hot & fresh, made to order
            </span>
            <h1 className="mt-5 text-5xl leading-[0.95] md:text-7xl">
              It's always <span className="text-gold">Krunch</span> Hour.
            </h1>
            <p className="mt-5 text-lg text-cream/85">Double-crunch burgers, loaded pizzas and golden fries — delivered hot or ready for pickup.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="xl"><Link to="/menu">Order Now</Link></Button>
              <Button asChild variant="ghostLight" size="xl"><Link to="/deals">See Deals</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl">What are you craving?</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c) => (
            <Link key={c.id} to="/menu" search={{ category: c.slug }} className="card-lift group overflow-hidden rounded-3xl bg-maroon-deep text-cream">
              <img src={CATEGORY_IMAGE[c.slug]} alt="" loading="lazy" width={816} height={816} className="aspect-square w-full object-cover opacity-90 transition group-hover:scale-105" />
              <div className="p-3 text-center font-display text-sm md:text-base">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl">Fan favourites</h2>
            <Link to="/menu" className="font-semibold text-primary hover:underline">Full menu →</Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />)}
            {featured.map((p) => <ProductCard key={p.id} product={p} onSelect={setSel} />)}
          </div>
        </div>
      </section>


      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 md:grid-cols-3">
        <InfoCard icon={<Bike />} title="Home delivery">
          {s ? <>Delivery fee {formatPKR(s.delivery_fee)}{s.free_delivery_over ? ` · free over ${formatPKR(s.free_delivery_over)}` : ""}. Cash on delivery.{s.delivery_zones ? <><br />Areas: {s.delivery_zones}</> : " Delivery areas to be announced."}</> : "Loading…"}
        </InfoCard>
        <InfoCard icon={<Store />} title="Pickup">Order ahead and collect from the counter. Pay cash on pickup.</InfoCard>
        <InfoCard icon={<Clock />} title="Opening hours">
          <span className="whitespace-pre-line">{s?.opening_hours ?? "Hours will be announced soon."}</span>
          {s?.phone && <span className="mt-2 flex items-center gap-2"><Phone className="h-4 w-4" />{s.phone}</span>}
        </InfoCard>
      </section>
      <ProductDialog product={sel} onClose={() => setSel(null)} />
    </>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{icon}</div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
