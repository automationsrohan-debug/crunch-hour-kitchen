import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Variation = { id: string; name: string; price: number; sort_order: number; is_available: boolean };
export type Addon = { id: string; name: string; price: number; category_id: string; is_available: boolean };
export type Category = { id: string; name: string; slug: string; description: string | null; sort_order: number; is_active: boolean };
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_key: string | null;
  base_price: number;
  is_available: boolean;
  is_featured: boolean;
  is_demo: boolean;
  sort_order: number;
  category_id: string;
  categories: { slug: string; name: string } | null;
  product_variations: Variation[];
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug,name), product_variations(*)")
      .eq("is_available", true)
      .order("sort_order");
    if (error) throw error;
    return (data as unknown as Product[]).map((p) => ({
      ...p,
      product_variations: p.product_variations.filter((v) => v.is_available).sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
});

export const addonsQuery = queryOptions({
  queryKey: ["addons"],
  queryFn: async () => {
    const { data, error } = await supabase.from("addons").select("*").eq("is_available", true).order("price");
    if (error) throw error;
    return data as Addon[];
  },
});

export type Settings = {
  restaurant_name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  opening_hours: string | null;
  delivery_fee: number;
  free_delivery_over: number | null;
  min_order_amount: number;
  delivery_zones: string | null;
  accepting_orders: boolean;
  estimated_delivery_minutes: number;
};

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("restaurant_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data as Settings;
  },
});

export function startingPrice(p: Product): number {
  if (p.product_variations.length) return Math.min(...p.product_variations.map((v) => Number(v.price)));
  return Number(p.base_price);
}
