import { Plus } from "lucide-react";
import { productImage } from "@/lib/images";
import { formatPKR } from "@/lib/format";
import { startingPrice, type Product } from "@/lib/menu";

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  const from = product.product_variations.length > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="card-lift group flex flex-col overflow-hidden rounded-3xl bg-card text-left shadow-sm ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Customize and add ${product.name}`}
    >
      <div className="relative aspect-square overflow-hidden bg-maroon-deep">
        <img
          src={productImage(product.image_key, product.categories?.slug)}
          alt={product.name}
          loading="lazy"
          width={816}
          height={816}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Popular</span>
        )}
        {product.is_demo && (
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">Demo</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-primary">
            {from && <span className="text-xs font-medium text-muted-foreground">from </span>}
            {formatPKR(startingPrice(product))}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </button>
  );
}
