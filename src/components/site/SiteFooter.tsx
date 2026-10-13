import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import logoLight from "@/assets/logo-light.svg.asset.json";
import { settingsQuery } from "@/lib/menu";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  return (
    <footer className="bg-maroon-deep text-cream no-print">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <img src={logoLight.url} alt="KRUNCH HOUR" className="h-32 w-32 object-contain" />
          <p className="mt-2 text-sm text-cream/70">Crunch you can hear. Flavour you remember.</p>
        </div>
        <div>
          <h3 className="text-gold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li><Link to="/menu" className="hover:text-gold">Order Online</Link></li>
            <li><Link to="/deals" className="hover:text-gold">Deals & Offers</Link></li>
            <li><Link to="/track" className="hover:text-gold">Track Order</Link></li>
            <li><Link to="/about" className="hover:text-gold">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-gold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>{s?.phone ?? "Phone: not set yet"}</li>
            <li>{s?.address ?? "Address: not set yet"}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-gold">Hours</h3>
          <p className="mt-3 whitespace-pre-line text-sm text-cream/80">{s?.opening_hours ?? "Opening hours: not set yet"}</p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} KRUNCH HOUR · <Link to="/admin" className="hover:text-gold">Staff</Link>
      </div>
    </footer>
  );
}
