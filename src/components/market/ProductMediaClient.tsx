import { Icon } from "../Icon";
import { categoryIcon, imageUrl, type Product } from "@/lib/market";

/** Small product thumbnail for client components (no server imports). */
export function ProductMedia({ product }: { product: Pick<Product, "images" | "category"> }) {
  const first = product.images[0];
  return (
    <span className="product-media product-media--thumb" data-category={product.category}>
      {first ? (
        // eslint-disable-next-line @next/next/no-img-element -- product photos
        <img src={imageUrl(first)} alt="" loading="lazy" />
      ) : (
        <Icon name={categoryIcon[product.category] ?? "package"} size={20} />
      )}
    </span>
  );
}
