"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AssetRecord, BootstrapData } from "@/components/asset-workspace";
import { CategoryIcon } from "@/components/category-icon";
import { statusLabels } from "@/lib/constants";
import { SelectField } from "@/components/ui/select-field";

export function AssetListScreen({
  bootstrap,
  categoryId: categoryIdOverride,
  showCategoryCard = true
}: {
  bootstrap: BootstrapData;
  categoryId?: string;
  showCategoryCard?: boolean;
}) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const categoryId = categoryIdOverride || searchParams.get("categoryId") || "";
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const selectedCategory = bootstrap.categories.find((category) => category.id === categoryId);

  const loadAssets = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (userId) params.set("userId", userId);
    if (categoryId) params.set("categoryId", categoryId);
    const response = await fetch(`/api/assets?${params.toString()}`);
    const data = await response.json();
    setAssets(data.assets || []);
  }, [categoryId, query, status, userId]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-8">
      {showCategoryCard ? (
      <section className="mb-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Asset category</h2>
            <p className="text-sm text-slate-500">{selectedCategory ? `${selectedCategory.name} selected` : "Browse assets by category"}</p>
          </div>
          {categoryId ? (
            <Link className="rounded-md border border-line px-3 py-2 text-sm font-medium" href="/assets">
              All
            </Link>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {bootstrap.categories.map((category) => {
            const active = category.id === categoryId;
            return (
              <Link
                key={category.id}
                href={`/assets/category/${encodeURIComponent(category.id)}`}
                className="grid min-h-[112px] place-items-center rounded-md border border-line bg-white p-3 text-center hover:border-action"
                style={active ? { borderColor: category.color, background: `${category.color}10` } : undefined}
              >
                <CategoryIcon name={category.icon} color={category.color} size={24} />
                <span className="mt-2 text-sm font-semibold text-slate-900">{category.name}</span>
                <span className="text-xs text-slate-500">{category._count?.assets || 0} assets</span>
              </Link>
            );
          })}
        </div>
      </section>
      ) : null}
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{selectedCategory ? selectedCategory.name : "Assets"}</h2>
            <p className="text-sm text-slate-500">
              {assets.length} assets loaded
              {selectedCategory ? ` in ${selectedCategory.name}` : ""}
              {userId ? ` for ${bootstrap.users.find((item) => item.id === userId)?.name || "selected user"}` : ""}
            </p>
          </div>
          <Link href={categoryId ? `/assets/new?categoryId=${encodeURIComponent(categoryId)}` : "/assets/new"} className="inline-flex items-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> New
          </Link>
        </div>
        <div className="mb-3 grid grid-cols-[1fr,128px] gap-2 sm:grid-cols-[1fr,150px]">
          <label className="relative block min-w-0">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input
              className="w-full rounded-md border border-line py-2 pl-9 pr-3 text-sm"
              placeholder="Search assets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <SelectField
            value={status || "__all__"}
            onChange={(value) => setStatus(value === "__all__" ? "" : value)}
            options={[
              { value: "__all__", label: "All status" },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
            ]}
          />
        </div>
        <button onClick={loadAssets} className="mb-3 w-full rounded-md border border-line py-2 text-sm font-medium" type="button">
          Apply filters
        </button>
        <div className="space-y-2">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`} className="block rounded-md border border-line bg-white p-3 hover:border-action">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{asset.customNumber || asset.internalNumber}</p>
                  <p className="truncate text-sm text-slate-600">{asset.model}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium" style={{ background: `${asset.category.color}22`, color: asset.category.color }}>
                  <CategoryIcon name={asset.category.icon} color={asset.category.color} size={14} />
                  {asset.category.name}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{statusLabels[asset.status]} · {asset.locationRef?.name || asset.location || "No location"}</p>
            </Link>
          ))}
          {!assets.length ? (
            <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-slate-500">
              No assets yet. Create the first one.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
