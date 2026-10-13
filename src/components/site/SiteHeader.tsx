import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import logoLight from "@/assets/logo-light.svg.asset.json";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/deals", label: "Deals" },
  { to: "/track", label: "Track Order" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-maroon-deep/95 text-cream backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
        <Link to="/" className="flex items-center" aria-label="KRUNCH HOUR home">
          <img src={logoLight.url} alt="KRUNCH HOUR" className="h-14 w-14 scale-150 object-contain md:h-20 md:w-20" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-cream/85 transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative rounded-full p-2.5 hover:bg-cream/10">
            <ShoppingBag className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
          <Button asChild variant="gold" className="hidden sm:inline-flex">
            <Link to="/menu">Order Now</Link>
          </Button>
          <button
            className="rounded-full p-2.5 hover:bg-cream/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-cream/10 px-4 pb-4 lg:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-cream/10"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild variant="gold" className="mt-2 w-full">
            <Link to="/menu" onClick={() => setOpen(false)}>Order Now</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
