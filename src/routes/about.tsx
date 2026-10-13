import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import fries from "@/assets/fries.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — KRUNCH HOUR" },
      { name: "description", content: "The story behind KRUNCH HOUR — fresh, crispy fast food made to order." },
      { property: "og:title", content: "About KRUNCH HOUR" },
      { property: "og:description", content: "Fresh, crispy fast food made to order." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHero title="About Us" subtitle="Small kitchen. Big crunch." />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <img src={fries} alt="Loaded fries" loading="lazy" width={816} height={816} className="rounded-3xl shadow-card" />
        <div className="space-y-4 text-lg text-muted-foreground">
          <h2 className="text-3xl text-foreground">Made fresh, every order</h2>
          <p>KRUNCH HOUR is a local fast-food kitchen serving crispy chicken burgers, loaded pizzas, fries, pasta and wraps — cooked when you order, never sitting under a lamp.</p>
          <p>We keep it simple: quality chicken, generous toppings, sauces made in-house, and a crunch you can hear.</p>
          <Button asChild variant="maroon" size="lg"><Link to="/menu">See the menu</Link></Button>
        </div>
      </section>
    </>
  );
}
