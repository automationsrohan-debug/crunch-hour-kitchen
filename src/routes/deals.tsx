import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals & Offers — KRUNCH HOUR" },
      { name: "description", content: "KRUNCH HOUR special offers and combos." },
      { property: "og:title", content: "KRUNCH HOUR Deals" },
      { property: "og:description", content: "Special offers on burgers, pizza and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deals,
});

function Deals() {
  return (
    <>
      <PageHero title="Deals & Offers" subtitle="New deals are coming soon." />
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">There are no active deals right now. Check back soon!</p>
        <Button asChild variant="maroon" className="mt-6"><Link to="/menu">Browse menu</Link></Button>
      </section>
    </>
  );
}
