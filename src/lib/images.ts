import pizza from "@/assets/pizza.jpg";
import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import pasta from "@/assets/pasta.jpg";
import wrap from "@/assets/wrap.jpg";
import drink from "@/assets/drink.jpg";

export const FOOD_IMAGES: Record<string, string> = { pizza, burger, fries, pasta, wrap, drink };

export const CATEGORY_IMAGE: Record<string, string> = {
  pizza,
  "chicken-burgers": burger,
  fries,
  pasta,
  wraps: wrap,
  "cold-drinks": drink,
};

export function productImage(imageKey: string | null | undefined, categorySlug?: string): string {
  if (imageKey && imageKey.startsWith("http")) return imageKey;
  return (imageKey && FOOD_IMAGES[imageKey]) || (categorySlug && CATEGORY_IMAGE[categorySlug]) || burger;
}
