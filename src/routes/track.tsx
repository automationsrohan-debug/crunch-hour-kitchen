import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR, STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ order: z.string().optional(), phone: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track Your Order — KRUNCH HOUR" },
      { name: "description", content: "Check the live status of your KRUNCH HOUR order." },
      { property: "og:title", content: "Track your KRUNCH HOUR order" },
      { property: "og:description", content: "Live order status." },
    ],
  }),
  component: Track,
});

type Tracked = { order_number: string; status: string; total: number; subtotal: number; discount_amount: number; delivery_fee: number; payment_method: string; items: { name: string; variation: string | null; quantity: number; line_total: number }[] };

function Track() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [num, setNum] = useState(search.order ?? "");
  const [ph, setPh] = useState(search.phone ?? "");
  const q = useQuery({
    queryKey: ["track", search.order, search.phone],
    enabled: !!search.order && !!search.phone,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("track_order", { _order_number: search.order!, _phone: search.phone! });
      if (error) throw error;
      return data as Tracked | null;
    },
  });
  const o = q.data;
  return (
    <>
      <PageHero title="Track Order" subtitle="Enter your order number and phone number." />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); navigate({ search: { order: num.trim(), phone: ph.trim() } }); }}>
          <Input aria-label="Order number" placeholder="KH-1001" value={num} onChange={(e) => setNum(e.target.value)} />
          <Input aria-label="Phone" placeholder="03XX XXXXXXX" value={ph} onChange={(e) => setPh(e.target.value)} />
          <Button variant="maroon" type="submit">Track</Button>
        </form>
        {q.isLoading && <p>Loading…</p>}
        {q.isFetched && !o && <p className="text-muted-foreground">No order found with those details.</p>}
        {o && (
          <div className="space-y-3 rounded-3xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Order {o.order_number} · thank you!</p>
            <h2 className="text-3xl text-primary">{STATUS_LABELS[o.status]}</h2>
            {o.items.map((i, k) => <div key={k} className="flex justify-between text-sm"><span>{i.quantity}× {i.name}{i.variation ? ` (${i.variation})` : ""}</span><span>{formatPKR(i.line_total)}</span></div>)}
            <div className="border-t pt-2 text-sm">Discount: {formatPKR(o.discount_amount)} · Delivery: {formatPKR(o.delivery_fee)}</div>
            <div className="text-lg font-bold">Total: {formatPKR(o.total)} ({o.payment_method === "cash_on_delivery" ? "Cash on Delivery" : "Cash on Pickup"})</div>
          </div>
        )}
      </div>
    </>
  );
}
