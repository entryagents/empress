"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Image as ImageIcon, Sparkles } from "lucide-react";
import type { Product, Category, ProductVariant, ProductAddonGroup, ProductImage } from "@/types/catalogue";
import { koboToNaira, nairaToKobo } from "@/types/catalogue";
import { saveProductAction } from "../actions";

interface Props {
  initialProduct?: Product | null;
  categories: Category[];
}

export function ProductForm({ initialProduct, categories }: Props) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Basic Info
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || categories[0]?.id || "");
  const [shortDesc, setShortDesc] = useState(initialProduct?.short_description || "");
  const [fullDesc, setFullDesc] = useState(initialProduct?.full_description || "");

  // Pricing in Naira
  const [basePriceNaira, setBasePriceNaira] = useState(
    initialProduct ? koboToNaira(initialProduct.base_price_kobo).toString() : "4500"
  );

  // Availability & Prep
  const [minPrep, setMinPrep] = useState(initialProduct?.min_prep_time_minutes?.toString() || "15");
  const [maxPrep, setMaxPrep] = useState(initialProduct?.max_prep_time_minutes?.toString() || "25");
  const [availabilityStatus, setAvailabilityStatus] = useState<string>(
    initialProduct?.availability_status || "Fresh to order"
  );
  const [isAvailable, setIsAvailable] = useState(initialProduct?.is_available ?? true);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured ?? false);
  const [isPublished, setIsPublished] = useState(initialProduct?.is_published ?? true);

  // Images Manager
  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : [
          {
            id: "img-init-1",
            product_id: initialProduct?.id || "",
            image_url: "/images/food/shawarma.jpg",
            storage_path: null,
            alt_text: "Dish presentation",
            is_primary: true,
            display_order: 1,
            created_at: "2026-11-15T00:00:00Z",
          },
        ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Variants Manager
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);
  const [varName, setVarName] = useState("");
  const [varAdjNaira, setVarAdjNaira] = useState("0");

  // Add-on Groups Manager
  const [addonGroups, setAddonGroups] = useState<ProductAddonGroup[]>(initialProduct?.addon_groups || []);
  const [groupName, setGroupName] = useState("");
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMax, setGroupMax] = useState("3");

  // Helper: Slug auto-fill
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initialProduct) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  // Add Image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const newImg: ProductImage = {
      id: `img-${Date.now()}`,
      product_id: initialProduct?.id || "",
      image_url: newImageUrl.trim(),
      storage_path: null,
      alt_text: `${name} photography`,
      is_primary: images.length === 0,
      display_order: images.length + 1,
      created_at: new Date().toISOString(),
    };
    setImages([...images, newImg]);
    setNewImageUrl("");
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Add Variant
  const handleAddVariant = () => {
    if (!varName.trim()) return;
    const adjKobo = nairaToKobo(parseFloat(varAdjNaira) || 0);
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      product_id: initialProduct?.id || "",
      name: varName.trim(),
      sku: null,
      price_adjustment_kobo: adjKobo,
      explicit_price_kobo: null,
      is_available: true,
      display_order: variants.length + 1,
      created_at: new Date().toISOString(),
    };
    setVariants([...variants, newVar]);
    setVarName("");
    setVarAdjNaira("0");
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  // Add Add-on Group
  const handleAddGroup = () => {
    if (!groupName.trim()) return;
    const newGrp: ProductAddonGroup = {
      id: `ag-${Date.now()}`,
      product_id: initialProduct?.id || "",
      name: groupName.trim(),
      description: null,
      min_selections: groupRequired ? 1 : 0,
      max_selections: parseInt(groupMax, 10) || 3,
      is_required: groupRequired,
      display_order: addonGroups.length + 1,
      created_at: new Date().toISOString(),
      addons: [],
    };
    setAddonGroups([...addonGroups, newGrp]);
    setGroupName("");
  };

  // Add Single Addon into Group
  const handleAddAddon = (groupId: string, addonName: string, priceNaira: number) => {
    if (!addonName.trim()) return;
    setAddonGroups(
      addonGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            addons: [
              ...(g.addons || []),
              {
                id: `add-${Date.now()}`,
                addon_group_id: groupId,
                name: addonName.trim(),
                description: null,
                price_kobo: nairaToKobo(priceNaira),
                is_available: true,
                display_order: (g.addons?.length || 0) + 1,
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
        return g;
      })
    );
  };

  const handleRemoveAddon = (groupId: string, addonId: string) => {
    setAddonGroups(
      addonGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            addons: g.addons?.filter((a) => a.id !== addonId),
          };
        }
        return g;
      })
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    setAddonGroups(addonGroups.filter((g) => g.id !== groupId));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    const formData = new FormData();
    if (initialProduct?.id) {
      formData.append("id", initialProduct.id);
    }
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("sku", sku);
    formData.append("category_id", categoryId);
    formData.append("short_description", shortDesc);
    formData.append("full_description", fullDesc);
    formData.append("base_price_naira", basePriceNaira);
    formData.append("min_prep_time_minutes", minPrep);
    formData.append("max_prep_time_minutes", maxPrep);
    formData.append("availability_status", availabilityStatus);
    formData.append("is_available", isAvailable ? "true" : "false");
    formData.append("is_featured", isFeatured ? "true" : "false");
    formData.append("is_published", isPublished ? "true" : "false");

    formData.append("variants_json", JSON.stringify(variants));
    formData.append("addon_groups_json", JSON.stringify(addonGroups));
    formData.append("images_json", JSON.stringify(images));

    try {
      const res = await saveProductAction(formData);
      if (res.success) {
        router.push("/admin/menu");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save product.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/menu"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to Dishes
      </Link>

      <div className="mt-4 border-b border-wine-900/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">
          {initialProduct ? "Modify Product" : "Catalogue Addition"}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">
          {initialProduct ? initialProduct.name : "Create New Dish"}
        </h1>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Section 1: Basic Information */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
            1. Dish Essentials
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Dish Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Deluxe Small Chops Platter"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. deluxe-small-chops-platter"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm font-mono text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Stock Keeping Unit (SKU)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. EMP-0042"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm font-mono text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
              Short Description (Card summary) *
            </label>
            <input
              type="text"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="e.g. Hand-rolled warm flatbread packed with spiced shredded meat..."
              className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
              Full Culinary Description (Detail page)
            </label>
            <textarea
              rows={3}
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              placeholder="Detailed culinary notes describing the marinade, cooking techniques, and serving suggestions..."
              className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Preparation */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
            2. Pricing &amp; Kitchen Preparation
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Base Price (NGN ₦) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={basePriceNaira}
                onChange={(e) => setBasePriceNaira(e.target.value)}
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm font-serif font-bold text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
              <p className="mt-1 text-[0.65rem] text-wine-600">Stored in database as integer kobo.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Min Prep Time (mins)
              </label>
              <input
                type="number"
                min="1"
                value={minPrep}
                onChange={(e) => setMinPrep(e.target.value)}
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Max Prep Time (mins)
              </label>
              <input
                type="number"
                min="1"
                value={maxPrep}
                onChange={(e) => setMaxPrep(e.target.value)}
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-4 border-t border-wine-900/10 pt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Status Badge
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-2.5 py-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
              >
                <option value="Fresh to order">Fresh to order</option>
                <option value="Available">Available</option>
                <option value="Seasonal">Seasonal</option>
                <option value="Sold out">Sold out</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_available"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="size-4 rounded border-wine-900/30 text-wine-900 focus:ring-champagne-500"
              />
              <label htmlFor="is_available" className="text-xs font-medium text-wine-950">
                Available to Order
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="size-4 rounded border-wine-900/30 text-wine-900 focus:ring-champagne-500"
              />
              <label htmlFor="is_featured" className="text-xs font-medium text-wine-950">
                Featured Spotlight
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="size-4 rounded border-wine-900/30 text-wine-900 focus:ring-champagne-500"
              />
              <label htmlFor="is_published" className="text-xs font-medium text-wine-950">
                Published Online
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Photography / Images */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2 flex items-center justify-between">
            <span>3. Product Photography (Multiple Images)</span>
            <span className="text-xs font-normal text-wine-600">
              {images.length} Image{images.length !== 1 ? "s" : ""}
            </span>
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`relative rounded border p-2 flex flex-col justify-between ${
                  img.is_primary ? "border-champagne-500 bg-champagne-500/5 ring-1 ring-champagne-500" : "border-wine-900/10 bg-ivory-50/50"
                }`}
              >
                <div className="relative aspect-4/3 w-full overflow-hidden rounded bg-wine-950">
                  <Image src={img.image_url} alt={img.alt_text} fill className="object-cover" sizes="200px" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.7rem]">
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(idx)}
                    className={`font-semibold uppercase tracking-wider ${
                      img.is_primary ? "text-champagne-700" : "text-wine-600 hover:text-wine-950"
                    }`}
                  >
                    {img.is_primary ? "★ Primary" : "Set Primary"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL (e.g. /images/food/shawarma.jpg or HTTPS link)"
              className="flex-1 rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors"
            >
              <Plus className="size-3.5" /> Add Photo
            </button>
          </div>
        </div>

        {/* Section 4: Portions / Variations */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2 flex items-center justify-between">
            <span>4. Portions &amp; Variations (e.g. Regular, Jumbo, Feast)</span>
            <span className="text-xs font-normal text-wine-600">{variants.length} Defined</span>
          </h2>

          <div className="mt-4 space-y-2">
            {variants.length === 0 ? (
              <p className="text-xs text-wine-700 italic">
                No portions specified. The base price will apply uniformly.
              </p>
            ) : (
              variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded border border-wine-900/10 bg-ivory-50/50 px-3.5 py-2 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-wine-950">{v.name}</span>
                    <span className="text-wine-700 font-mono">
                      {v.price_adjustment_kobo >= 0 ? `+₦${(v.price_adjustment_kobo / 100).toLocaleString()}` : `-₦${(Math.abs(v.price_adjustment_kobo) / 100).toLocaleString()}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(v.id)}
                    className="text-wine-500 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-wine-900/10">
            <input
              type="text"
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
              placeholder="Portion name (e.g. Jumbo Size)"
              className="flex-1 min-w-[140px] rounded border border-wine-900/20 bg-ivory-50/50 px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
            <input
              type="number"
              step="50"
              value={varAdjNaira}
              onChange={(e) => setVarAdjNaira(e.target.value)}
              placeholder="Price diff in ₦ (e.g. 1500)"
              className="w-32 rounded border border-wine-900/20 bg-ivory-50/50 px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors"
            >
              <Plus className="size-3.5" /> Add Portion
            </button>
          </div>
        </div>

        {/* Section 5: Add-ons & Extras */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
            5. Add-on Groups &amp; Extras
          </h2>

          <div className="mt-4 space-y-6">
            {addonGroups.map((grp) => (
              <div key={grp.id} className="rounded border border-wine-900/15 bg-ivory-50/40 p-4">
                <div className="flex items-center justify-between border-b border-wine-900/10 pb-2">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-wine-950">{grp.name}</h3>
                    <p className="text-[0.68rem] text-wine-600">
                      {grp.is_required ? "Required" : "Optional"} · Max selections: {grp.max_selections}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(grp.id)}
                    className="text-xs text-rose-600 hover:text-rose-800"
                  >
                    Delete Group
                  </button>
                </div>

                <div className="mt-3 space-y-1.5">
                  {grp.addons?.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between rounded bg-white px-3 py-1.5 text-xs border border-wine-900/10"
                    >
                      <span className="text-wine-950">{addon.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-wine-700 font-medium">
                          +₦{(addon.price_kobo / 100).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(grp.id, addon.id)}
                          className="text-wine-400 hover:text-rose-600"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-form to add item into group */}
                <AddonInputRow onAdd={(name, price) => handleAddAddon(grp.id, name, price)} />
              </div>
            ))}
          </div>

          {/* Create new add-on group */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-wine-900/10 pt-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="New group name (e.g. Choose Protein)"
              className="flex-1 min-w-[160px] rounded border border-wine-900/20 bg-ivory-50/50 px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="grp_req"
                checked={groupRequired}
                onChange={(e) => setGroupRequired(e.target.checked)}
                className="size-3.5 rounded"
              />
              <label htmlFor="grp_req" className="text-xs text-wine-800">
                Required
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-wine-800">Max:</label>
              <input
                type="number"
                min="1"
                value={groupMax}
                onChange={(e) => setGroupMax(e.target.value)}
                className="w-14 rounded border border-wine-900/20 bg-ivory-50/50 px-2 py-1 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAddGroup}
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors"
            >
              <Plus className="size-3.5" /> Add Group
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-wine-900/10 pt-4">
          <Link
            href="/admin/menu"
            className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50 transition-colors"
          >
            <Save className="size-4 text-champagne-400" />
            {isSaving ? "Saving..." : initialProduct ? "Update Dish" : "Create Dish"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddonInputRow({ onAdd }: { onAdd: (name: string, price: number) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("500");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name, parseFloat(price) || 0);
    setName("");
    setPrice("500");
  };

  return (
    <div className="mt-2.5 flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add option (e.g. Extra Cheese)"
        className="flex-1 rounded border border-wine-900/15 bg-white px-2.5 py-1 text-xs text-wine-950 focus:outline-none"
      />
      <input
        type="number"
        step="50"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price ₦"
        className="w-24 rounded border border-wine-900/15 bg-white px-2 py-1 text-xs text-wine-950 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="rounded bg-wine-800 px-2.5 py-1 text-xs font-medium text-ivory-50 hover:bg-wine-700"
      >
        + Add
      </button>
    </div>
  );
}
