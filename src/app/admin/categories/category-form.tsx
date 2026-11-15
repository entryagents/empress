"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import type { Category } from "@/types/catalogue";
import { saveCategoryAction } from "../actions";

interface Props {
  initialData?: Category | null;
}

export function CategoryForm({ initialData }: Props) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "/images/food/shawarma.jpg");
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || "1");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initialData) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    const formData = new FormData();
    if (initialData?.id) {
      formData.append("id", initialData.id);
    }
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("image_url", imageUrl);
    formData.append("display_order", displayOrder);
    formData.append("is_published", isPublished ? "true" : "false");

    try {
      const res = await saveCategoryAction(formData);
      if (res.success) {
        router.push("/admin/categories");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save category.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to Categories
      </Link>

      <div className="mt-4 border-b border-wine-900/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">
          {initialData ? "Edit Category" : "New Category"}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">
          {initialData ? initialData.name : "Create Food Category"}
        </h1>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Shawarma & Wraps"
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
              placeholder="e.g. shawarma-wraps"
              className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 font-mono focus:border-champagne-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief editorial summary explaining the culinary character of this category..."
            className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
              Category Photography URL *
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/food/shawarma.jpg or HTTPS URL"
              className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
            <p className="mt-1 text-[0.7rem] text-wine-700/80">
              Standard food photo path or authenticated Supabase bucket image URL.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
              Display Sequence Order
            </label>
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-wine-900/10 pt-4">
          <input
            type="checkbox"
            id="is_published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="size-4 rounded border-wine-900/30 text-wine-900 focus:ring-champagne-500"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-wine-950">
            Publish on live public menu immediately
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-wine-900/10 pt-4">
          <Link
            href="/admin/categories"
            className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded bg-wine-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50 transition-colors"
          >
            <Save className="size-4 text-champagne-400" />
            {isSaving ? "Saving..." : initialData ? "Update Category" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
