import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/menu";
import { errorMessage, formatPKR, normalizePkPhone } from "@/lib/format";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout — KRUNCH HOUR" },
      { name: "description", content: "Review your order and check out with cash on delivery or pickup." },
      { property: "og:title", content: "KRUNCH HOUR Cart" },
      { property: "og:description", content: "Review and place your order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const nav = useNavigate();
  const { data: s } = useQuery(settingsQuery);
  const [type, setType] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [instr, setInstr] = useState("");
  const [busy, setBusy] = useState(false);

  const fee = type === "delivery" && s ? (s.free_delivery_over && cart.subtotal >= s.free_delivery_over ? 0 : Number(s.delivery_fee)) : 0;

  async function place() {
    const p = normalizePkPhone(phone);
    if (name.trim().length < 2) return toast.error("Please enter your name");
    if (!p) return toast.error("Enter a valid Pakistani mobile number (03XX XXXXXXX)");
    if (type === "delivery" && addr.trim().length < 8) return toast.error("Please enter a complete address");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      payload: {
        order_type: type, customer_name: name, customer_phone: p,
        delivery_address: type === "delivery" ? addr : null, instructions: instr,
        coupon_code: null,
        items: cart.lines.map((l) => ({ product_id: l.product_id, variation_id: l.variation_id, addon_ids: l.addons.map((a) => a.id), quantity: l.quantity, notes: l.notes ?? null })),
      },
    });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    const r = data as { order_number: string };
    cart.clear();
    nav({ to: "/track", search: { order: r.order_number, phone: p } });
  }

  if (cart.lines.length === 0)
    return (<><PageHero title="Your Cart" /><div className="py-20 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Button asChild variant="maroon" className="mt-4"><Link to="/menu">Browse menu</Link></Button></div></>);

  return (
    <>
      <PageHero title="Cart & Checkout" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="space-y-3">
            {cart.lines.map((l) => (
              <div key={l.key} className="flex gap-4 rounded-3xl border bg-card p-3">
                <img src={l.image} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                <div className="flex-1">
                  <div className="font-bold">{l.name}{l.variation_name && <span className="font-normal text-muted-foreground"> · {l.variation_name}</span>}</div>
                  {l.addons.length > 0 && <div className="text-xs text-muted-foreground">+ {l.addons.map((a) => a.name).join(", ")}</div>}
                  {l.notes && <div className="text-xs italic text-muted-foreground">"{l.notes}"</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <button aria-label="Decrease" className="rounded-full border p-1.5" onClick={() => cart.setQty(l.key, l.quantity - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center font-bold">{l.quantity}</span>
                    <button aria-label="Increase" className="rounded-full border p-1.5" onClick={() => cart.setQty(l.key, l.quantity + 1)}><Plus className="h-3 w-3" /></button>
                    <button aria-label="Remove" className="ml-2 text-destructive" onClick={() => cart.remove(l.key)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="font-bold">{formatPKR(l.unit_price * l.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-3xl border bg-card p-6">
            <div className="grid grid-cols-2 gap-2">
              {(["delivery", "pickup"] as const).map((t) => (
                <Button key={t} type="button" variant={type === t ? "maroon" : "outline"} onClick={() => setType(t)}>{t === "delivery" ? "Home delivery" : "Pickup"}</Button>
              ))}
            </div>
            <label className="block text-sm font-semibold">Name<Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-1" /></label>
            <label className="block text-sm font-semibold">Mobile number<Input value={phone} inputMode="tel" placeholder="03XX XXXXXXX" onChange={(e) => setPhone(e.target.value)} className="mt-1" /></label>
            {type === "delivery" && <label className="block text-sm font-semibold">Delivery address<Textarea value={addr} onChange={(e) => setAddr(e.target.value)} className="mt-1" /></label>}
            <label className="block text-sm font-semibold">Order instructions (optional)<Textarea value={instr} maxLength={500} onChange={(e) => setInstr(e.target.value)} className="mt-1" /></label>
          </div>
        </div>
        <aside className="h-fit space-y-3 rounded-3xl border bg-card p-6">
          <Row k="Subtotal" v={formatPKR(cart.subtotal)} />
          <Row k="Delivery" v={formatPKR(fee)} />
          <div className="border-t pt-3"><Row k="Total (estimate)" v={formatPKR(cart.subtotal + fee)} bold /></div>
          <p className="text-xs text-muted-foreground">Payment: {type === "delivery" ? "Cash on Delivery" : "Cash on Pickup"}. Final total is confirmed by the restaurant system.</p>
          <Button variant="gold" size="lg" className="w-full" disabled={busy} onClick={place}>{busy ? "Placing…" : "Place order"}</Button>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-lg font-bold" : "text-sm"}`}><span>{k}</span><span>{v}</span></div>;
}
