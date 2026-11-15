"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Eye, EyeOff, Trash2, Edit3, Sparkles, AlertCircle, CheckCircle2, UtensilsCrossed, Database } from "lucide-react";
import type { Product, Category } from "@/types/catalogue";
import { formatKobo } from "@/types/catalogue";
import { toggleProductPublishAction, archiveProductAction, seedCatalogueServerAction } from "../actions";

interface Props {
  initialProducts: Product[];
  categories: Category[];
}

export function AdminMenuListClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ? p.sku.toLowerCase().includes(search.toLowerCase()) : false);
      const matchesCategory =
        selectedCategory === "all" ||
        p.category_id === selectedCategory ||
        p.category?.slug === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const handleTogglePublish = async (prod: Product) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPending(true);
    try {
      const res = await toggleProductPublishAction(prod.id, prod.is_published);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, is_published: !p.is_published } : p))
        );
        setSuccessMsg(`Product "${prod.name}" status updated.`);
      } else {
        setErrorMsg(res.error || "Failed to update dish.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleArchive = async (prod: Product) => {
    if (!confirm(`Are you sure you want to archive "${prod.name}"? This removes it from the menu.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPending(true);
    try {
      const res = await archiveProductAction(prod.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        setSuccessMsg(`Dish "${prod.name}" has been archived.`);
      } else {
        setErrorMsg(res.error || "Cannot archive dish.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleSeedDatabase = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSeeding(true);
    try {
      const res = await seedCatalogueServerAction();
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">Product Administration</p>
          <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">Dishes &amp; Culinary Catalogue</h1>
          <p className="mt-1 text-sm text-wine-800/80">
            Control items, variations, add-ons, integer pricing (kobo), and live publishing status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-white px-3 py-2 text-xs font-semibold text-wine-900 hover:bg-ivory-100 transition-colors shadow-2xs"
            title="Seed baseline database rows if Supabase tables are empty"
          >
            <Database className="size-3.5 text-champagne-600" />
            {isSeeding ? "Syncing..." : "Sync DB"}
          </button>
          <Link
            href="/admin/menu/new"
            className="inline-flex items-center gap-2 rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors"
          >
            <Plus className="size-4 text-champagne-400" />
            Add New Dish
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-wine-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes by name or SKU..."
            className="w-full rounded border border-wine-900/15 bg-white pl-9 pr-3 py-1.5 text-xs text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-800">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dishes Table */}
      <div className="mt-4 overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
              <tr>
                <th className="px-4 py-3">Dish / SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3 text-center">Variations</th>
                <th className="px-4 py-3 text-center">Add-ons</th>
                <th className="px-4 py-3 text-center">Prep Time</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-900/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-wine-700">
                    <UtensilsCrossed className="mx-auto size-8 text-wine-300 mb-2" />
                    No dishes matched your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const primaryImg =
                    prod.images?.find((img) => img.is_primary)?.image_url ||
                    prod.images?.[0]?.image_url ||
                    "/images/food/shawarma.jpg";
                  const catName = categories.find((c) => c.id === prod.category_id || c.slug === prod.category_id)?.name || "General";

                  return (
                    <tr key={prod.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden rounded border border-wine-900/10 bg-wine-950">
                            <Image
                              src={primaryImg}
                              alt={prod.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-serif text-sm font-semibold text-wine-950">{prod.name}</p>
                              {prod.is_featured && (
                                <span title="Featured Dish" className="inline-flex items-center">
                                  <Sparkles className="size-3 text-champagne-500 fill-champagne-500" />
                                </span>
                              )}
                            </div>
                            <span className="text-[0.65rem] text-wine-600 font-mono">SKU: {prod.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-wine-900/5 px-2 py-0.5 text-wine-900">
                          {catName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-serif font-medium text-wine-950 text-sm">
                        {formatKobo(prod.base_price_kobo)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-ivory-200 px-2 py-0.5 font-semibold text-wine-900">
                          {prod.variants?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-ivory-200 px-2 py-0.5 font-semibold text-wine-900">
                          {prod.addon_groups?.reduce((sum, g) => sum + (g.addons?.length || 0), 0) ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-wine-700">
                        {prod.min_prep_time_minutes}–{prod.max_prep_time_minutes}m
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                            prod.is_published
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {prod.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(prod)}
                            disabled={isPending}
                            title={prod.is_published ? "Unpublish dish" : "Publish dish"}
                            className="rounded p-1.5 text-wine-700 hover:bg-wine-100/60 hover:text-wine-950 transition-colors"
                          >
                            {prod.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                          <Link
                            href={`/admin/menu/${prod.id}`}
                            title="Edit dish"
                            className="rounded p-1.5 text-wine-700 hover:bg-wine-100/60 hover:text-wine-950 transition-colors"
                          >
                            <Edit3 className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleArchive(prod)}
                            disabled={isPending}
                            title="Archive dish"
                            className="rounded p-1.5 text-wine-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
