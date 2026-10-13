import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import burger from "@/assets/burger.jpg";
import pizza from "@/assets/pizza.jpg";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals & Offers — KRUNCH HOUR" },
      { name: "description", content: "Current KRUNCH HOUR discount codes and special offers." },
      { property: "og:title", content: "KRUNCH HOUR Deals" },
      { property: "og:description", content: "Save on burgers, pizza and more." },
    ],
  }),
  component: Deals,
});

const DEALS = [
  { code: "KRUNCH10", title: "10% off over Rs. 1,000", text: "Applies to your food subtotal, up to Rs. 500 off.", img: burger },
];

function Deals() {
  return (
    <>
      <PageHero title="Deals & Offers" subtitle="Apply a code at checkout — discounts are verified when you place your order." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:grid-cols-2">
        {DEALS.map((d) => (
          <div key={d.code} className="card-lift flex overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            <img src={d.img} alt="" loading="lazy" width={816} height={816} className="w-36 object-cover sm:w-48" />
            <div className="flex flex-1 flex-col p-6">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Demo offer</span>
              <h2 className="mt-1 text-2xl">{d.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-xl border-2 border-dashed border-primary px-3 py-1.5 font-display text-primary">{d.code}</span>
                <Button asChild variant="maroon" size="sm"><Link to="/menu">Order</Link></Button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex overflow-hidden rounded-3xl bg-maroon-grad text-cream">
          <img src={pizza} alt="" loading="lazy" width={816} height={816} className="w-36 object-cover sm:w-48" />
          <div className="p-6">
            <h2 className="text-2xl text-gold">More deals coming</h2>
            <p className="mt-2 text-sm text-cream/80">New codes can be added by the restaurant at any time.</p>
          </div>
        </div>
      </section>
    </>
  );
}
