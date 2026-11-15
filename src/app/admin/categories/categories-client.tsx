"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Eye, EyeOff, Trash2, Edit3, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import type { Category } from "@/types/catalogue";
import { toggleCategoryPublishAction, archiveCategoryAction } from "../actions";

interface Props {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleTogglePublish = async (cat: Category) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPending(true);
    try {
      const res = await toggleCategoryPublishAction(cat.id, cat.is_published);
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_published: !c.is_published } : c))
        );
        setSuccessMsg(`Category "${cat.name}" status updated.`);
      } else {
        setErrorMsg(res.error || "Failed to update category.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleArchive = async (cat: Category) => {
    if (cat.item_count && cat.item_count > 0) {
      setErrorMsg(`Cannot archive "${cat.name}" because it still contains ${cat.item_count} dish(es). Reassign or archive those dishes first.`);
      return;
    }

    if (!confirm(`Are you sure you want to archive category "${cat.name}"?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPending(true);
    try {
      const res = await archiveCategoryAction(cat.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setSuccessMsg(`Category "${cat.name}" archived.`);
      } else {
        setErrorMsg(res.error || "Cannot archive category.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">Catalogue Architecture</p>
          <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">Food Categories</h1>
          <p className="mt-1 text-sm text-wine-800/80">
            Manage category ordering, descriptions, photography and visibility across the digital menu.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded bg-wine-900 px-4 py-2.5 text-xs font-semibold text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors"
        >
          <Plus className="size-4 text-champagne-400" />
          Add Category
        </Link>
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

      {/* Categories Table */}
      <div className="mt-6 overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
              <tr>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Dishes</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-900/5">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-wine-700">
                    <Layers className="mx-auto size-8 text-wine-300 mb-2" />
                    No categories found. Create your first category above.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-medium text-wine-800">
                      {cat.display_order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded border border-wine-900/10 bg-wine-950">
                          {cat.image_url ? (
                            <Image
                              src={cat.image_url}
                              alt={cat.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-[0.6rem] text-champagne-300">
                              No pic
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-serif text-sm font-semibold text-wine-950">{cat.name}</p>
                          <span className="text-[0.65rem] text-wine-600 font-mono">ID: {cat.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-wine-700">{cat.slug}</td>
                    <td className="px-4 py-3 text-wine-800/80 max-w-xs truncate" title={cat.description || ""}>
                      {cat.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-ivory-200 px-2 py-0.5 font-semibold text-wine-900">
                        {cat.item_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                          cat.is_published
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {cat.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(cat)}
                          disabled={isPending}
                          title={cat.is_published ? "Unpublish category" : "Publish category"}
                          className="rounded p-1.5 text-wine-700 hover:bg-wine-100/60 hover:text-wine-950 transition-colors"
                        >
                          {cat.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                        <Link
                          href={`/admin/categories/${cat.id}`}
                          title="Edit category"
                          className="rounded p-1.5 text-wine-700 hover:bg-wine-100/60 hover:text-wine-950 transition-colors"
                        >
                          <Edit3 className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleArchive(cat)}
                          disabled={isPending || Boolean(cat.item_count && cat.item_count > 0)}
                          title={
                            cat.item_count && cat.item_count > 0
                              ? "Cannot archive: contains active dishes"
                              : "Archive category"
                          }
                          className={`rounded p-1.5 transition-colors ${
                            cat.item_count && cat.item_count > 0
                              ? "text-wine-300 cursor-not-allowed"
                              : "text-wine-600 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
