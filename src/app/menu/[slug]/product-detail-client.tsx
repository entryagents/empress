"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, ShieldAlert, Plus, Minus, Check, ShoppingBag, ArrowRight } from "lucide-react";
import type { Product, ProductVariant, ProductAddon } from "@/types/catalogue";
import { formatKobo, calculateItemPrice } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import type { ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: "def", product_id: product.id, image_url: `/images/food/${product.slug}.jpg`, alt_text: product.name, display_order: 1, is_primary: true, created_at: "", storage_path: null }];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [added, setAdded] = useState(false);

  const { addItem } = useCart();

  // Toggle an add-on
  const toggleAddon = (addon: ProductAddon, maxSelections: number) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      // Check max selections within the group
      const currentGroupCount = prev.filter((a) => a.addon_group_id === addon.addon_group_id).length;
      if (maxSelections && currentGroupCount >= maxSelections) {
        // Replace oldest in this group or prevent
        const filtered = prev.filter((a) => a.addon_group_id !== addon.addon_group_id);
        return [...filtered, addon];
      }
      return [...prev, addon];
    });
  };

  const unitPriceKobo = calculateItemPrice(product.base_price_kobo, selectedVariant, selectedAddons);
  const totalPriceKobo = unitPriceKobo * quantity;

  const handleAddToCart = () => {
    addItem(product, {
      variant: selectedVariant,
      addons: selectedAddons,
      specialInstructions: instructions,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-ivory-50 pb-28 pt-28 text-wine-900 min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="border-b border-wine-900/10 bg-ivory-100 py-3.5">
        <div className="container-x flex items-center justify-between text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-wine-800/70">
            <Link href="/" className="hover:text-wine-950">Home</Link>
            <span>/</span>
            <Link href="/menu" className="hover:text-wine-950">Our Menu</Link>
            <span>/</span>
            <span className="text-wine-950 font-medium">{product.name}</span>
          </nav>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950"
          >
            <ArrowLeft className="size-3.5" /> Back to Menu
          </Link>
        </div>
      </div>

      <div className="container-x mt-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* LEFT: Product Photography Gallery */}
          <div className="lg:col-span-7">
            {/* Primary Main Image Frame */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-wine-900/10 bg-wine-950 shadow-lift">
              {images[activeImageIdx]?.image_url.startsWith("/images/food/") ? (
                <FoodImage
                  name={(product.slug || "shawarma") as ImageKey}
                  sizes="(min-width:1024px) 55vw, 95vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <Image
                  src={images[activeImageIdx]?.image_url || "/images/food/shawarma.jpg"}
                  alt={images[activeImageIdx]?.alt_text || product.name}
                  fill
                  sizes="(min-width:1024px) 55vw, 95vw"
                  className="object-cover"
                  priority
                />
              )}

              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="eyebrow rounded bg-wine-950/85 px-3 py-1 text-xs text-champagne-300 backdrop-blur-xs">
                  {product.category?.name || "Dish"}
                </span>
                <span className="rounded bg-emerald-950/85 px-2.5 py-0.5 text-xs font-medium text-emerald-300 backdrop-blur-xs">
                  {product.availability_status}
                </span>
              </div>
            </div>

            {/* Thumbnail Strip (if multiple photos) */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={cn(
                      "relative size-20 shrink-0 overflow-hidden rounded-[2px] border-2 transition-all",
                      activeImageIdx === idx
                        ? "border-champagne-500 ring-2 ring-champagne-500/30"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description & Culinary Details */}
            <div className="mt-10 rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft">
              <h2 className="font-serif text-2xl font-medium text-wine-950">
                Culinary Description
              </h2>
              <p className="mt-4 leading-relaxed text-wine-800/85 text-base sm:text-lg font-light">
                {product.full_description || product.short_description}
              </p>

              {/* Ingredients & Allergens */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="mt-8 border-t border-wine-900/10 pt-6">
                  <h3 className="eyebrow text-champagne-500">Key Ingredients</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded bg-ivory-100 px-3 py-1 text-xs font-medium text-wine-900 border border-wine-900/10"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.allergens && product.allergens.length > 0 && (
                <div className="mt-6 border-t border-wine-900/10 pt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <ShieldAlert className="size-4 text-amber-700" />
                    <span>Allergen Notice:</span>
                  </div>
                  <p className="mt-1 text-xs text-wine-800/70">
                    Contains {product.allergens.join(", ")}. Please inform our team of severe food allergies in the special instructions box.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Order Configurator Panel */}
          <div className="lg:col-span-5 sticky top-36">
            <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 sm:p-8 shadow-lift">
              {/* Title & Live Pricing Header */}
              <div>
                <span className="eyebrow text-champagne-500">
                  {product.category?.name}
                </span>
                <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-wine-950 leading-tight">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-baseline justify-between border-b border-wine-900/10 pb-4">
                  <div>
                    <span className="font-serif text-3xl font-bold tracking-tight text-wine-950">
                      {formatKobo(totalPriceKobo)}
                    </span>
                    {quantity > 1 && (
                      <span className="ml-2 text-xs text-wine-700">
                        ({formatKobo(unitPriceKobo)} each)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-wine-800/80">
                    <Clock className="size-3.5 text-champagne-500" />
                    <span>{product.min_prep_time_minutes}–{product.max_prep_time_minutes} mins</span>
                  </div>
                </div>
              </div>

              {/* Portion Variations (if available) */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    Select Portion Size
                  </label>
                  <div className="mt-3 space-y-2.5">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const priceDiff = variant.explicit_price_kobo !== null
                        ? variant.explicit_price_kobo - product.base_price_kobo
                        : variant.price_adjustment_kobo;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[2px] border p-3.5 text-left text-sm transition-all",
                            isSelected
                              ? "border-wine-900 bg-ivory-100/80 font-semibold ring-1 ring-wine-900 shadow-xs"
                              : "border-wine-900/20 bg-white hover:border-wine-900/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "grid size-4 place-items-center rounded-full border",
                              isSelected ? "border-wine-900 bg-wine-900 text-white" : "border-wine-900/40"
                            )}>
                              {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{variant.name}</span>
                          </div>

                          <span className="text-xs text-wine-700">
                            {priceDiff === 0
                              ? "Standard"
                              : priceDiff > 0
                              ? `+${formatKobo(priceDiff)}`
                              : `-${formatKobo(Math.abs(priceDiff))}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-on Groups (if available) */}
              {product.addon_groups && product.addon_groups.length > 0 && (
                <div className="mt-8 space-y-6">
                  {product.addon_groups.map((group) => (
                    <div key={group.id} className="border-t border-wine-900/10 pt-5">
                      <div className="flex items-baseline justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          {group.name}
                        </label>
                        <span className="text-[0.65rem] text-wine-700">
                          {group.max_selections ? `Up to ${group.max_selections}` : "Optional"}
                        </span>
                      </div>
                      {group.description && (
                        <p className="mt-1 text-xs text-wine-800/70">{group.description}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        {group.addons?.map((addon) => {
                          const isChecked = selectedAddons.some((a) => a.id === addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => toggleAddon(addon, group.max_selections)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-[2px] border p-3 text-left text-xs transition-all",
                                isChecked
                                  ? "border-champagne-500 bg-champagne-400/15 font-semibold"
                                  : "border-wine-900/15 bg-white hover:border-wine-900/40"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={cn(
                                  "grid size-4 place-items-center rounded-[2px] border",
                                  isChecked ? "border-wine-900 bg-wine-900 text-white" : "border-wine-900/30"
                                )}>
                                  {isChecked && <Check className="size-3" />}
                                </span>
                                <span>{addon.name}</span>
                              </div>
                              <span className="font-serif font-medium text-wine-900">
                                +{formatKobo(addon.price_kobo)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Kitchen Special Instructions */}
              <div className="mt-6 border-t border-wine-900/10 pt-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Special Kitchen Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra pepper, no onions, sauce on the side"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-2 w-full rounded-[2px] border border-wine-900/20 bg-ivory-50 px-3 py-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>

              {/* Quantity Stepper & Add to Order CTA */}
              <div className="mt-8 border-t border-wine-900/10 pt-6">
                <div className="flex items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center rounded-[2px] border border-wine-900/25 bg-ivory-50 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="text-wine-800 hover:text-wine-950 p-1"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-wine-950">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="text-wine-800 hover:text-wine-950 p-1"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Add to Order Button */}
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={handleAddToCart}
                    className="flex-1 justify-between shadow-soft font-semibold"
                  >
                    <span>{added ? "Added to Bag!" : "Add to Order"}</span>
                    <span>{formatKobo(totalPriceKobo)}</span>
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-between text-[0.7rem] text-wine-700/80">
                  <span>✓ Prepared fresh upon order receipt</span>
                  <span>Delivery &amp; Pickup options available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Dishes Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-wine-900/10 pt-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow text-champagne-500">More From This Category</p>
                <h3 className="mt-2 font-serif text-3xl font-light text-wine-950">
                  You May Also Enjoy
                </h3>
              </div>
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-800 hover:text-wine-950"
              >
                View Full Menu <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/menu/${rel.slug}`}
                  className="group rounded-[2px] border border-wine-900/10 bg-white p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-wine-950">
                    <FoodImage
                      name={(rel.slug || "shawarma") as ImageKey}
                      sizes="30vw"
                      hoverZoom
                      className="object-cover"
                    />
                  </div>
                  <h4 className="mt-3 font-serif text-lg font-medium text-wine-950 group-hover:underline">
                    {rel.name}
                  </h4>
                  <p className="mt-1 font-serif text-sm font-bold text-wine-900">
                    {formatKobo(rel.base_price_kobo)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
