export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-maroon-grad text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <h1 className="animate-rise text-4xl md:text-6xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-cream/80 md:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}
