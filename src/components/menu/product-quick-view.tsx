"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Minus,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import type { Product, ProductVariant, ProductAddon } from "@/types/catalogue";
import { formatKobo, calculateItemPrice } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { addItem } = useCart();

  // Reset internal state when a new product is selected
  useEffect(() => {
    if (product) {
      setSelectedVariant(
        product.variants && product.variants.length > 0 ? product.variants[0] : undefined
      );
      setSelectedAddons([]);
      setQuantity(1);
      setInstructions("");
      setActiveImageIdx(0);
      setIsAdded(false);
      setCopiedLink(false);
    }
  }, [product]);

  // Lock body scroll when quick view modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!product) return null;

  const imagesList =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: "primary",
            product_id: product.id,
            image_url: `/images/food/${product.slug}.jpg`,
            alt_text: product.name,
            display_order: 1,
            is_primary: true,
            created_at: "",
            storage_path: null,
          },
        ];

  const toggleAddon = (addon: ProductAddon, maxSelections: number) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      const countInGroup = prev.filter((a) => a.addon_group_id === addon.addon_group_id).length;
      if (maxSelections && countInGroup >= maxSelections) {
        // Replace oldest in this group
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
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 900);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/menu/${product.slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 lg:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-wine-950/75 backdrop-blur-md"
          />

          {/* Modal / Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-ivory-50 text-wine-950 shadow-2xl sm:max-h-[88vh] sm:rounded-2xl border border-wine-900/15"
          >
            {/* Mobile Sheet Handle Bar */}
            <div className="flex h-6 w-full items-center justify-center sm:hidden pt-2">
              <span className="h-1 w-12 rounded-full bg-wine-900/25" />
            </div>

            {/* Header Controls (Close & Share) */}
            <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="grid size-9 place-items-center rounded-full bg-white/90 text-wine-900 shadow-soft backdrop-blur-xs transition hover:bg-wine-900 hover:text-white"
                aria-label="Share product link"
                title="Copy link to dish"
              >
                {copiedLink ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-white/90 text-wine-900 shadow-soft backdrop-blur-xs transition hover:bg-wine-900 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Main Modal Grid */}
            <div className="grid flex-1 overflow-y-auto sm:grid-cols-12">
              {/* LEFT / TOP: Immersive Visual Food Imagery */}
              <div className="relative sm:col-span-6 bg-wine-950 flex flex-col justify-between">
                <div className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden">
                  <FoodImage
                    name={product.slug}
                    src={imagesList[activeImageIdx]?.image_url}
                    alt={imagesList[activeImageIdx]?.alt_text || product.name}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    priority
                    className="object-cover"
                  />

                  {/* Gradient Vignette for Contrast */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/80 via-transparent to-wine-950/20" />

                  {/* Top Badges */}
                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 pr-20">
                    <span className="eyebrow rounded-full bg-wine-950/85 px-3 py-1 text-[0.65rem] text-champagne-300 backdrop-blur-xs border border-champagne-400/20">
                      {product.category?.name || "Dish"}
                    </span>
                    <span className="rounded-full bg-emerald-950/85 px-2.5 py-0.5 text-[0.65rem] font-medium text-emerald-300 backdrop-blur-xs border border-emerald-400/20">
                      {product.availability_status}
                    </span>
                  </div>

                  {/* Prep Time & Portion Badge */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-wine-950/80 px-3 py-1 text-xs text-ivory-100 backdrop-blur-xs border border-white/10">
                      <Clock className="size-3 text-champagne-400" />
                      <span>{product.min_prep_time_minutes}–{product.max_prep_time_minutes} mins prep</span>
                    </div>
                  </div>

                  {/* Multi-image Arrow Nav (if > 1) */}
                  {imagesList.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
                        }}
                        className="pointer-events-auto grid size-8 place-items-center rounded-full bg-wine-950/60 text-white backdrop-blur-xs hover:bg-wine-950"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
                        }}
                        className="pointer-events-auto grid size-8 place-items-center rounded-full bg-wine-950/60 text-white backdrop-blur-xs hover:bg-wine-950"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip (if multiple photos) */}
                {imagesList.length > 1 && (
                  <div className="flex gap-2.5 p-3.5 bg-wine-950/90 overflow-x-auto no-scrollbar border-t border-white/10">
                    {imagesList.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={cn(
                          "relative size-14 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                          activeImageIdx === idx
                            ? "border-champagne-400 ring-2 ring-champagne-400/40"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <Image
                          src={img.image_url}
                          alt={img.alt_text || product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product Details, Variations, Add-ons & Order Action */}
              <div className="flex flex-col justify-between p-5 sm:p-7 sm:col-span-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Title & Price Header */}
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-wine-950 leading-tight">
                      {product.name}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-serif text-2xl font-bold tracking-tight text-wine-950">
                        {formatKobo(unitPriceKobo)}
                      </span>
                      <span className="text-xs text-wine-700/80 uppercase tracking-wider">
                        {selectedVariant ? selectedVariant.name : "Standard portion"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-wine-800/80">
                      {product.full_description || product.short_description}
                    </p>
                  </div>

                  {/* Portion Variants (if any) */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-2.5 border-t border-wine-900/10 pt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                        1. Select Portion Size
                      </label>
                      <div className="space-y-2">
                        {product.variants.map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          const diff =
                            v.explicit_price_kobo !== null
                              ? v.explicit_price_kobo - product.base_price_kobo
                              : v.price_adjustment_kobo;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs transition-all",
                                isSelected
                                  ? "border-wine-900 bg-ivory-100 font-semibold ring-1 ring-wine-900 shadow-xs"
                                  : "border-wine-900/15 bg-white hover:border-wine-900/40 text-wine-800"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={cn(
                                    "grid size-4 place-items-center rounded-full border",
                                    isSelected
                                      ? "border-wine-900 bg-wine-900 text-white"
                                      : "border-wine-900/40"
                                  )}
                                >
                                  {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                                </span>
                                <span>{v.name}</span>
                              </div>
                              <span className="font-mono font-medium text-wine-950">
                                {diff === 0 ? "Included" : `+${formatKobo(diff)}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add-on Groups (if any) */}
                  {product.addon_groups && product.addon_groups.length > 0 && (
                    <div className="space-y-4 border-t border-wine-900/10 pt-4">
                      {product.addon_groups.map((group) => (
                        <div key={group.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-wine-900">
                              {group.name}
                            </label>
                            <span className="text-[0.68rem] text-wine-700/80">
                              {group.max_selections ? `Up to ${group.max_selections}` : "Optional"}
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-[0.7rem] text-wine-700/70">{group.description}</p>
                          )}
                          <div className="space-y-1.5">
                            {group.addons?.map((addon) => {
                              const isChecked = selectedAddons.some((a) => a.id === addon.id);
                              return (
                                <button
                                  key={addon.id}
                                  type="button"
                                  onClick={() => toggleAddon(addon, group.max_selections)}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all",
                                    isChecked
                                      ? "border-champagne-500 bg-champagne-500/10 font-medium ring-1 ring-champagne-500/30"
                                      : "border-wine-900/15 bg-white hover:border-wine-900/30 text-wine-800"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={cn(
                                        "grid size-4 place-items-center rounded border",
                                        isChecked
                                          ? "border-champagne-500 bg-champagne-500 text-white"
                                          : "border-wine-900/30"
                                      )}
                                    >
                                      {isChecked && <Check className="size-3 stroke-[3]" />}
                                    </span>
                                    <span>{addon.name}</span>
                                  </div>
                                  <span className="font-mono text-wine-950 font-medium">
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

                  {/* Special Kitchen Instructions */}
                  <div className="border-t border-wine-900/10 pt-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900 mb-1.5">
                      Special Kitchen Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Mild pepper, extra serviettes, sauce on the side..."
                      className="w-full rounded-lg border border-wine-900/20 bg-white p-2.5 text-xs text-wine-950 placeholder:text-wine-800/40 focus:border-champagne-500 focus:outline-none"
                    />
                  </div>

                  {/* Ingredients & Allergens Accordion / Chips */}
                  {((product.ingredients && product.ingredients.length > 0) ||
                    (product.allergens && product.allergens.length > 0)) && (
                    <div className="rounded-lg bg-ivory-100/70 p-3 text-xs text-wine-800 border border-wine-900/10 space-y-2">
                      {product.ingredients && product.ingredients.length > 0 && (
                        <div>
                          <span className="font-semibold text-wine-950">Ingredients: </span>
                          <span className="text-wine-800/80">{product.ingredients.join(", ")}</span>
                        </div>
                      )}
                      {product.allergens && product.allergens.length > 0 && (
                        <div className="flex items-start gap-1.5 text-amber-900">
                          <ShieldAlert className="size-3.5 shrink-0 mt-0.5 text-amber-700" />
                          <span>Allergens: {product.allergens.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Quantity, Price, Add to Cart */}
                <div className="mt-6 border-t border-wine-900/10 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 rounded-full border border-wine-900/20 bg-white p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="grid size-8 place-items-center rounded-full text-wine-800 hover:bg-ivory-100 disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-semibold text-wine-950">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="grid size-8 place-items-center rounded-full text-wine-800 hover:bg-ivory-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    {/* Total Price Display */}
                    <div className="text-right">
                      <span className="block text-[0.65rem] text-wine-700 uppercase tracking-wider">
                        Total for bag
                      </span>
                      <span className="font-serif text-2xl font-bold tracking-tight text-wine-950">
                        {formatKobo(totalPriceKobo)}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!product.is_available}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-soft",
                      !product.is_available
                        ? "bg-wine-900/20 text-wine-950/40 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-700 text-white"
                        : "bg-wine-900 text-ivory-50 hover:bg-wine-800 hover:shadow-lift"
                    )}
                  >
                    {isAdded ? (
                      <>
                        <Check className="size-4" /> Added to Order Bag!
                      </>
                    ) : !product.is_available ? (
                      "Currently Unavailable"
                    ) : (
                      <>
                        <Plus className="size-4" /> Add to Order • {formatKobo(totalPriceKobo)}
                      </>
                    )}
                  </button>

                  {/* Full Page Link */}
                  <div className="text-center pt-1">
                    <Link
                      href={`/menu/${product.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-wine-700 underline underline-offset-4 hover:text-wine-950"
                    >
                      View dedicated editorial dish page <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
