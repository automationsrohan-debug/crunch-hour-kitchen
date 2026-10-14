import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, formatPKR, STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Portal — KRUNCH HOUR" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "KRUNCH HOUR staff portal for orders and menu." },
      { property: "og:title", content: "KRUNCH HOUR Staff" },
      { property: "og:description", content: "Staff portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Status = "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
const FLOW: Status[] = ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed"];

function useSession() {
  const [state, setState] = useState<{ loading: boolean; userId: string | null; email?: string | undefined }>({ loading: true, userId: null });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setState({ loading: false, userId: data.user?.id ?? null, email: data.user?.email }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setState({ loading: false, userId: s?.user.id ?? null, email: s?.user.email }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}

function Admin() {
  const s = useSession();
  const roles = useQuery({
    queryKey: ["my-roles", s.userId],
    enabled: !!s.userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", s.userId!);
      if (error) throw error;
      return data.map((r) => r.role as string);
    },
  });
  const qc = useQueryClient();

  if (s.loading) return <Center>Loading…</Center>;
  if (!s.userId) return <Login />;
  if (roles.isLoading) return <Center>Checking access…</Center>;
  if (!roles.data?.length)
    return (
      <Center>
        <h1 className="text-2xl text-primary">No staff access</h1>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as {s.email}. Ask the admin to give you a role. If this is the first account, claim admin.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="maroon" onClick={async () => {
            const { data, error } = await supabase.rpc("claim_first_admin");
            if (error || !data) return toast.error("An admin already exists.");
            toast.success("You are now admin"); qc.invalidateQueries({ queryKey: ["my-roles"] });
          }}>Claim admin (first user only)</Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </Center>
    );
  const isManager = roles.data.some((r) => r === "admin" || r === "manager");
  return <Dashboard email={s.email} isManager={isManager} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-4 text-center"><div className="max-w-md">{children}</div></div>;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    if (mode === "up" && !res.data.session) toast.success("Check your email to confirm, then sign in.");
  }
  return (
    <Center>
      <form onSubmit={submit} className="w-80 space-y-3 rounded-3xl border bg-card p-6 text-left">
        <h1 className="text-center text-2xl text-primary">Staff {mode === "in" ? "login" : "sign up"}</h1>
        <label className="block text-sm font-semibold">Email<Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></label>
        <label className="block text-sm font-semibold">Password<Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1" /></label>
        <Button variant="maroon" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
        <button type="button" className="w-full text-xs text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New staff? Create account" : "Have an account? Sign in"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground">Back to site</Link>
      </form>
    </Center>
  );
}

function Dashboard({ email, isManager }: { email?: string | undefined; isManager: boolean }) {
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-display text-xl">KRUNCH HOUR · Staff</span>
        <div className="flex items-center gap-2">
          {(["orders", "menu"] as const).filter((t) => t === "orders" || isManager).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "gold" : "ghostLight"} onClick={() => setTab(t)}>{t === "orders" ? "Orders" : "Menu & Prices"}</Button>
          ))}
          <span className="hidden text-xs opacity-80 sm:inline">{email}</span>
          <Button size="sm" variant="ghostLight" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-4">{tab === "orders" ? <Orders /> : <MenuEditor />}</div>
    </div>
  );
}

function beep() {
  try {
    const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.2;
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch { /* ignore */ }
}

function Orders() {
  const [filter, setFilter] = useState<"active" | "completed" | "cancelled">("active");
  const qc = useQueryClient();
  const seen = useRef<Set<string> | null>(null);
  const q = useQuery({
    queryKey: ["admin-orders"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("orders-live").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => qc.invalidateQueries({ queryKey: ["admin-orders"] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  useEffect(() => {
    if (!q.data) return;
    const ids = new Set(q.data.map((o) => o.id));
    if (seen.current && q.data.some((o) => !seen.current!.has(o.id) && o.status === "new")) { beep(); toast.info("New order received!"); }
    seen.current = ids;
  }, [q.data]);

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(errorMessage(error));
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }
  async function setRider(id: string, rider_name: string) {
    const { error } = await supabase.from("orders").update({ rider_name: rider_name || null }).eq("id", id);
    if (error) toast.error(errorMessage(error)); else toast.success("Rider saved");
  }

  if (q.isLoading) return <p>Loading orders…</p>;
  if (q.error) return <p className="text-destructive">Couldn't load orders: {errorMessage(q.error)}</p>;
  const all = q.data ?? [];
  const today = new Date().toDateString();
  const todays = all.filter((o) => new Date(o.created_at).toDateString() === today);
  const list = all.filter((o) => (filter === "active" ? !["completed", "cancelled"].includes(o.status) : o.status === filter));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat k="Today's orders" v={String(todays.length)} />
        <Stat k="Today's sales (completed)" v={formatPKR(todays.filter((o) => o.status === "completed").reduce((s, o) => s + Number(o.total), 0))} />
        <Stat k="New / pending" v={String(all.filter((o) => o.status === "new").length)} />
        <Stat k="In progress" v={String(all.filter((o) => !["new", "completed", "cancelled"].includes(o.status)).length)} />
      </div>
      <div className="flex gap-2">
        {(["active", "completed", "cancelled"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "maroon" : "outline"} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</Button>
        ))}
      </div>
      {list.length === 0 && <p className="text-muted-foreground">No orders here.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((o) => {
          const idx = FLOW.indexOf(o.status as Status);
          let next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
          if (next === "out_for_delivery" && o.order_type !== "delivery") next = "completed";
          return (
            <div key={o.id} className={`rounded-3xl border bg-card p-4 ${o.status === "new" ? "ring-2 ring-accent" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-primary">{o.order_number}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] ?? o.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.order_type} · {o.payment_method}</div>
              <div className="mt-2 text-sm"><b>{o.customer_name}</b> · <a href={`tel:${o.customer_phone}`} className="underline">{o.customer_phone}</a></div>
              {o.delivery_address && <div className="text-sm">📍 {o.delivery_address}</div>}
              <ul className="mt-2 space-y-1 border-t pt-2 text-sm">
                {o.order_items.map((i) => {
                  const ads = Array.isArray(i.addons) ? (i.addons as { name?: string }[]).map((a) => a.name).filter(Boolean) : [];
                  return (
                    <li key={i.id}>
                      <b>{i.quantity}×</b> {i.product_name}{i.variation_name ? ` (${i.variation_name})` : ""}
                      {ads.length > 0 && <div className="pl-5 text-xs text-muted-foreground">+ {ads.join(", ")}</div>}
                      {i.notes && <div className="pl-5 text-xs italic text-destructive">"{i.notes}"</div>}
                    </li>
                  );
                })}
              </ul>
              {o.instructions && <div className="mt-1 text-xs italic">Note: {o.instructions}</div>}
              <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatPKR(o.total)}</span></div>
              {o.order_type === "delivery" && !["completed", "cancelled"].includes(o.status) && (
                <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); setRider(o.id, String(new FormData(e.currentTarget).get("r") ?? "").trim()); }}>
                  <Input name="r" defaultValue={o.rider_name ?? ""} placeholder="Rider name" maxLength={60} className="h-8" />
                  <Button size="sm" variant="outline">Save</Button>
                </form>
              )}
              {!["completed", "cancelled"].includes(o.status) && (
                <div className="mt-3 flex gap-2">
                  {next && <Button size="sm" variant="maroon" className="flex-1" onClick={() => setStatus(o.id, next!)}>Mark {STATUS_LABELS[next as keyof typeof STATUS_LABELS] ?? next}</Button>}
                  <Button size="sm" variant="outline" onClick={() => confirm("Cancel this order?") && setStatus(o.id, "cancelled")}>Cancel</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-2xl border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="font-display text-2xl text-primary">{v}</div></div>;
}

function MenuEditor() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name), product_variations(*)").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  async function upd(table: "products" | "product_variations", id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) return toast.error(errorMessage(error));
    toast.success("Saved"); refresh();
  }

  if (q.isLoading) return <p>Loading menu…</p>;
  if (q.error) return <p className="text-destructive">{errorMessage(q.error)}</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Change prices and turn items on/off. Changes show on the website immediately.</p>
      {q.data!.map((p) => (
        <div key={p.id} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <b>{p.name}</b> <span className="text-xs text-muted-foreground">· {p.categories?.name}{p.is_demo ? " · demo" : ""}</span>
            </div>
            <Button size="sm" variant={p.is_available ? "outline" : "maroon"} onClick={() => upd("products", p.id, { is_available: !p.is_available })}>
              {p.is_available ? "Available — turn off" : "Hidden — turn on"}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {p.product_variations.length === 0 ? (
              <PriceField label="Price" value={Number(p.base_price)} onSave={(v) => upd("products", p.id, { base_price: v })} />
            ) : (
              [...p.product_variations].sort((a, b) => a.sort_order - b.sort_order).map((v) => (
                <PriceField key={v.id} label={v.name} value={Number(v.price)} onSave={(n) => upd("product_variations", v.id, { price: n })} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <form className="flex items-center gap-1 text-sm" onSubmit={(e) => { e.preventDefault(); const n = Number(v); if (!(n >= 0) || n > 100000) { toast.error("Invalid price"); return; } onSave(n); }}>
      <span className="font-semibold">{label}: Rs.</span>
      <Input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="h-8 w-24" />
      {Number(v) !== value && <Button size="sm" variant="maroon">Save</Button>}
    </form>
  );
}
