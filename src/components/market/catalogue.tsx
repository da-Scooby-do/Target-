import Link from "next/link";
import { Icon } from "../Icon";
import { AddToCart } from "./AddToCart";
import type { Dictionary } from "@/dictionaries";
import { formatPrice } from "@/lib/format";
import { href, type Locale } from "@/lib/i18n";
import { categoryIcon, categoryName, formatQty, imageUrl, productColumns, type Category, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

/** Photo of the product, or the category icon on a tinted tile when there is none yet. */
export function ProductMedia({ product, size = "card" }: { product: Pick<Product, "images" | "category" | "name">; size?: "card" | "large" | "thumb" }) {
  const first = product.images[0];
  return (
    <span className={`product-media product-media--${size}`} data-category={product.category}>
      {first ? (
        // eslint-disable-next-line @next/next/no-img-element -- photos come from the storage bucket, already sized by suppliers
        <img src={imageUrl(first)} alt="" loading="lazy" />
      ) : (
        <Icon name={categoryIcon[product.category] ?? "package"} size={size === "thumb" ? 22 : size === "large" ? 72 : 44} />
      )}
    </span>
  );
}

export function priceLabel(p: Pick<Product, "price" | "currency" | "unit">, locale: Locale, t: Dictionary["market"]) {
  return `${formatPrice(p.price, p.currency, locale)} ${t.perUnit.replace("{unit}", t.units[p.unit])}`;
}

function ProductCard({ product, locale, t, base }: { product: Product; locale: Locale; t: Dictionary["market"]; base: string }) {
  return (
    <li className="product-card">
      <ProductMedia product={product} />
      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link href={href(locale, `${base}/${product.id}`)} className="stretched-link">
            {product.name}
          </Link>
        </h3>
        <p className="product-card__seller">
          {product.suppliers?.name ? t.soldBy.replace("{name}", product.suppliers.name) : t.soldByTfs}
          {product.origin_country ? ` · ${product.origin_country}` : ""}
        </p>
        <p className="product-card__price">
          <b>{formatPrice(product.price, product.currency, locale)}</b> <span>{t.perUnit.replace("{unit}", t.units[product.unit])}</span>
        </p>
      </div>
    </li>
  );
}

/** Category chips, search and the product grid. Used on the public site and inside the app. */
export async function Catalogue({
  locale,
  dict,
  base,
  category,
  q,
}: {
  locale: Locale;
  dict: Dictionary;
  base: string;
  category?: string;
  q?: string;
}) {
  const t = dict.market;
  const supabase = await createClient();
  const [{ data: cats }, products] = await Promise.all([
    supabase.from("product_categories").select("*").order("sort"),
    (async () => {
      let query = supabase.from("products").select(productColumns).eq("status", "active").order("created_at", { ascending: false }).limit(120);
      if (category) query = query.eq("category", category);
      const term = q?.trim().replace(/[%,()]/g, " ").slice(0, 60);
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
      return (await query).data;
    })(),
  ]);
  const categories = (cats ?? []) as Category[];
  const list = (products ?? []) as unknown as Product[];
  const link = (c?: string) => {
    const params = new URLSearchParams();
    if (c) params.set("category", c);
    if (q) params.set("q", q);
    const s = params.toString();
    return href(locale, `${base}${s ? `?${s}` : ""}`);
  };

  return (
    <div className="catalogue">
      <div className="catalogue__bar">
        <nav className="cat-chips" aria-label={t.all}>
          <Link href={link()} className="cat-chip" aria-current={!category ? "true" : undefined}>
            <Icon name="grid" size={18} />
            {t.all}
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={link(c.slug)} className="cat-chip" aria-current={category === c.slug ? "true" : undefined}>
              <Icon name={categoryIcon[c.slug] ?? "package"} size={18} />
              {categoryName(c, locale)}
            </Link>
          ))}
        </nav>
        <form className="cat-search" role="search" action={href(locale, base)}>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label className="visually-hidden" htmlFor="cat-q">
            {t.search}
          </label>
          <Icon name="search" size={18} />
          <input id="cat-q" name="q" type="search" defaultValue={q ?? ""} placeholder={t.searchPlaceholder} />
          <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--sm">
            {t.searchButton}
          </button>
        </form>
      </div>
      <p className="catalogue__count" aria-live="polite">
        {t.results.replace("{n}", String(list.length))}
      </p>
      {list.length ? (
        <ul className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} t={t} base={base} />
          ))}
        </ul>
      ) : (
        <p className="empty-hero">{t.noResults}</p>
      )}
    </div>
  );
}

/** One product: photos, price, add to cart, specifications. */
export async function ProductDetail({
  locale,
  dict,
  id,
  base,
  cartHref,
}: {
  locale: Locale;
  dict: Dictionary;
  id: string;
  base: string;
  cartHref: string;
}) {
  const t = dict.market;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const [{ data }, { data: cats }] = await Promise.all([
    supabase.from("products").select(productColumns).eq("id", id).maybeSingle(),
    supabase.from("product_categories").select("*").order("sort"),
  ]);
  if (!data) return null;
  const p = data as unknown as Product;
  const cat = ((cats ?? []) as Category[]).find((c) => c.slug === p.category);

  return (
    <article className="product-detail">
      <Link href={href(locale, base)} className="back-link">
        {t.back}
      </Link>
      <div className="product-detail__grid">
        <div className="product-detail__media">
          <ProductMedia product={p} size="large" />
          {p.images.length > 1 ? (
            <ul className="product-thumbs">
              {p.images.slice(1).map((img) => (
                <li key={img}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage photos */}
                  <img src={imageUrl(img)} alt="" loading="lazy" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="product-detail__info">
          {cat ? <p className="tfs-eyebrow">{categoryName(cat, locale)}</p> : null}
          <h1 className="product-detail__title">{p.name}</h1>
          <p className="product-card__seller">{p.suppliers?.name ? t.soldBy.replace("{name}", p.suppliers.name) : t.soldByTfs}</p>
          <p className="product-detail__price">
            <b>{formatPrice(p.price, p.currency, locale)}</b> {t.perUnit.replace("{unit}", t.units[p.unit])}
            <small>{t.exVat}</small>
          </p>
          <ul className="product-facts">
            <li>
              <Icon name="package" size={18} />
              {t.minOrder.replace("{qty}", formatQty(p.min_qty)).replace("{unit}", t.units[p.unit])}
            </li>
            {p.origin_country ? (
              <li>
                <Icon name="globe" size={18} />
                {t.from.replace("{country}", p.origin_country)}
              </li>
            ) : null}
            {p.lead_time_days != null ? (
              <li>
                <Icon name="clock" size={18} />
                {t.leadTime.replace("{n}", String(p.lead_time_days))}
              </li>
            ) : null}
          </ul>
          {p.status === "active" ? (
            <AddToCart
              line={{
                id: p.id,
                name: p.name,
                unit: p.unit,
                price: Number(p.price),
                currency: p.currency,
                minQty: Number(p.min_qty),
                image: p.images[0] ?? null,
                category: p.category,
                qty: Number(p.min_qty),
              }}
              unitLabel={t.units[p.unit]}
              cartHref={cartHref}
              t={{ quantity: t.quantity, addToCart: t.addToCart, added: t.added, viewCart: t.viewCart, minWarning: t.cart.minWarning }}
            />
          ) : (
            <p className={`tfs-badge tfs-badge--gray`}>{dict.market.product.statuses[p.status]}</p>
          )}
          {p.description ? (
            <section>
              <h2 className="panel-subtitle">{t.description}</h2>
              <p className="product-detail__desc">{p.description}</p>
            </section>
          ) : null}
          {p.specs.length ? (
            <section>
              <h2 className="panel-subtitle">{t.specs}</h2>
              <dl className="spec-list">
                {p.specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
