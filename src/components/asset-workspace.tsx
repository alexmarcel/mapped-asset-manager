"use client";

import dynamic from "next/dynamic";
import { Plus, Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { type AssetStatusValue, statusLabels } from "@/lib/constants";
import { SelectField } from "@/components/ui/select-field";

const MapCanvas = dynamic(() => import("@/components/map-canvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="grid h-[520px] place-items-center rounded-lg border border-line bg-white">Loading map...</div>
});

export type CurrentUser = {
  id: string;
  name: string;
  contact?: string | null;
  email: string;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count?: { assets: number };
};

export type LocationOption = {
  id: string;
  name: string;
  _count?: { assets: number };
};

export type UserOption = {
  id: string;
  name: string;
  contact?: string | null;
  email: string;
  role: string;
  _count?: { assigned: number };
};

export type FloorMapOption = {
  id: string;
  name: string;
  site: { name: string };
  imageFile?: { publicUrl: string | null } | null;
  width: number;
  height: number;
};

export type BootstrapData = {
  categories: Category[];
  locations: LocationOption[];
  users: UserOption[];
  maps: FloorMapOption[];
};

export type AssetRecord = {
  id: string;
  internalNumber: string;
  customNumber: string | null;
  vendorAssetNumber: string | null;
  model: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  status: AssetStatusValue;
  location: string | null;
  locationId: string | null;
  locationRef?: { id: string; name: string } | null;
  categoryId: string;
  category: Category;
  currentUserId: string | null;
  currentUser: { name: string; email?: string } | null;
  photoFile?: { publicUrl: string | null } | null;
  photos?: Array<{
    id: string;
    file: { publicUrl: string | null; originalFilename: string };
  }>;
};

const emptyForm = {
  categoryId: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  status: "in_use" as AssetStatusValue,
  location: "",
  locationId: "",
  currentUserId: "",
  customNumber: "",
  vendorAssetNumber: ""
};

export function AssetWorkspace({ bootstrap }: { bootstrap: BootstrapData }) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selected, setSelected] = useState<AssetRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm, categoryId: bootstrap.categories[0]?.id || "" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeMapId, setActiveMapId] = useState(bootstrap.maps[0]?.id || "");

  const loadAssets = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    const response = await fetch(`/api/assets?${params.toString()}`);
    const data = await response.json();
    setAssets(data.assets || []);
  }, [query, status]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const activeMap = useMemo(
    () => bootstrap.maps.find((map) => map.id === activeMapId) || bootstrap.maps[0],
    [activeMapId, bootstrap.maps]
  );

  function editAsset(asset: AssetRecord) {
    setSelected(asset);
    setForm({
      categoryId: asset.categoryId,
      model: asset.model,
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      status: asset.status,
      location: asset.location || "",
      locationId: asset.locationId || "",
      currentUserId: asset.currentUserId || "",
      customNumber: asset.customNumber || "",
      vendorAssetNumber: asset.vendorAssetNumber || ""
    });
  }

  function newAsset() {
    setSelected(null);
    setForm({ ...emptyForm, categoryId: bootstrap.categories[0]?.id || "" });
  }

  async function saveAsset(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch(selected ? `/api/assets/${selected.id}` : "/api/assets", {
      method: selected ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Unable to save asset.");
      return;
    }
    setMessage(selected ? "Asset updated." : "Asset created.");
    setSelected(data.asset);
    await loadAssets();
  }

  async function uploadPhoto(file: File) {
    if (!selected) return;
    const data = new FormData();
    data.set("photo", file);
    await fetch(`/api/assets/${selected.id}/photo`, { method: "POST", body: data });
    await loadAssets();
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl min-w-0 gap-4 px-4 pb-24 pt-4 md:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] md:pb-8">
      <section className="min-w-0 space-y-4">
        <div id="asset-list" className="scroll-mt-20 rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Asset Register</h2>
              <p className="text-sm text-slate-500">{assets.length} assets loaded</p>
            </div>
            <button onClick={newAsset} className="inline-flex items-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> New
            </button>
          </div>
          <div className="mb-3 grid grid-cols-[1fr,140px] gap-2">
            <label className="relative block">
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
          <button onClick={loadAssets} className="mb-3 w-full rounded-md border border-line py-2 text-sm font-medium">Apply filters</button>
          <div className="max-h-[430px] space-y-2 overflow-auto pr-1">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => editAsset(asset)}
                className="w-full rounded-md border border-line bg-white p-3 text-left hover:border-action"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{asset.customNumber || asset.internalNumber}</p>
                    <p className="text-sm text-slate-600">{asset.model}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium" style={{ background: `${asset.category.color}22`, color: asset.category.color }}>
                    <CategoryIcon name={asset.category.icon} color={asset.category.color} size={14} />
                    {asset.category.name}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{statusLabels[asset.status]} · {asset.locationRef?.name || asset.location || "No location"}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        <form id="asset-details" onSubmit={saveAsset} className="scroll-mt-20 rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{selected ? selected.internalNumber : "New Asset"}</h2>
              <p className="text-sm text-slate-500">{selected ? "Edit asset details and upload photos." : "Create an asset record."}</p>
            </div>
            {selected ? (
              <a id="asset-qr" className="scroll-mt-24 rounded-md border border-line px-3 py-2 text-sm font-medium" href={`/a/${selected.internalNumber}`} target="_blank">
                QR link
              </a>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Model" value={form.model} onChange={(value) => setForm({ ...form, model: value })} required />
            <SelectField
              label="Category"
              value={form.categoryId}
              onChange={(value) => setForm({ ...form, categoryId: value })}
              options={bootstrap.categories.map((category) => ({ value: category.id, label: category.name }))}
            />
            <Field label="Serial number" value={form.serialNumber} onChange={(value) => setForm({ ...form, serialNumber: value })} />
            <Field label="Vendor asset number" value={form.vendorAssetNumber} onChange={(value) => setForm({ ...form, vendorAssetNumber: value })} />
            <Field label="Custom asset number" value={form.customNumber} onChange={(value) => setForm({ ...form, customNumber: value })} />
            <SelectField
              label="Location"
              value={form.locationId || "__none__"}
              onChange={(value) => setForm({ ...form, locationId: value === "__none__" ? "" : value })}
              options={[
                { value: "__none__", label: "No location" },
                ...bootstrap.locations.map((location) => ({ value: location.id, label: location.name }))
              ]}
            />
            <label className="text-sm font-medium">
              Purchase date
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
            </label>
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value as AssetStatusValue })}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Current user"
              className="md:col-span-2"
              value={form.currentUserId || "__none__"}
              onChange={(value) => setForm({ ...form, currentUserId: value === "__none__" ? "" : value })}
              options={[
                { value: "__none__", label: "Unassigned" },
                ...bootstrap.users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` }))
              ]}
            />
            <label id="asset-photo" className="scroll-mt-24 text-sm font-medium md:col-span-2">
              Photo
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" type="file" accept="image/*" disabled={!selected} onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])} />
            </label>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          <button className="mt-4 w-full rounded-md bg-action px-4 py-2.5 font-semibold text-white" disabled={saving}>
            {saving ? "Saving..." : selected ? "Update asset" : "Create asset"}
          </button>
        </form>

        <div id="asset-map" className="scroll-mt-20 min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Location Map</h2>
              <p className="text-sm text-slate-500">Pan, zoom, and drag asset pins.</p>
            </div>
            <div className="w-full max-w-sm">
              <SelectField
                value={activeMapId}
                onChange={setActiveMapId}
                options={bootstrap.maps.map((map) => ({ value: map.id, label: `${map.site.name} · ${map.name}` }))}
              />
            </div>
          </div>
          {activeMap ? <MapCanvas map={activeMap} assets={assets} /> : <div className="rounded-md border border-line p-6 text-sm text-slate-500">Create a floor map to place assets.</div>}
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 w-full rounded-md border border-line px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
