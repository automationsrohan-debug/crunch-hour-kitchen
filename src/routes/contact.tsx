import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { settingsQuery } from "@/lib/menu";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — KRUNCH HOUR" },
      { name: "description", content: "Phone, address and opening hours for KRUNCH HOUR." },
      { property: "og:title", content: "Contact KRUNCH HOUR" },
      { property: "og:description", content: "Get in touch or visit us." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: s, isLoading } = useQuery(settingsQuery);
  const rows = [
    { icon: <Phone />, label: "Phone", value: s?.phone, href: s?.phone ? `tel:${s.phone}` : undefined },
    { icon: <MessageCircle />, label: "WhatsApp", value: s?.whatsapp, href: s?.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, "").replace(/^0/, "92")}` : undefined },
    { icon: <MapPin />, label: "Address", value: s?.address },
    { icon: <Clock />, label: "Opening hours", value: s?.opening_hours },
  ];
  return (
    <>
      <PageHero title="Contact" subtitle="We'd love to hear from you." />
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-14 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-3xl border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{r.icon}</div>
            <h2 className="mt-4 text-lg">{r.label}</h2>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">
              {isLoading ? "Loading…" : r.value ? (r.href ? <a className="text-primary underline" href={r.href}>{r.value}</a> : r.value) : "Not set yet"}
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
