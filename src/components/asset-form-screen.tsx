"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { AssetRecord, BootstrapData, CurrentUser } from "@/components/asset-workspace";
import { type AssetStatusValue, statusLabels } from "@/lib/constants";
import { SelectField } from "@/components/ui/select-field";

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

export function AssetFormScreen({
  bootstrap,
  assetId,
  currentUser,
  initialCategoryId
}: {
  bootstrap: BootstrapData;
  assetId?: string;
  currentUser?: CurrentUser;
  initialCategoryId?: string;
}) {
  const router = useRouter();
  const defaultCategoryId = bootstrap.categories.some((category) => category.id === initialCategoryId)
    ? initialCategoryId || ""
    : bootstrap.categories[0]?.id || "";
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm, categoryId: defaultCategoryId });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canDelete = Boolean(asset && currentUser?.role === "ADMIN");

  useEffect(() => {
    if (!assetId) return;
    async function loadAsset() {
      const response = await fetch(`/api/assets/${assetId}`);
      const data = await response.json();
      if (!response.ok) {
        setMessage("Asset not found.");
        return;
      }
      const loaded = data.asset as AssetRecord;
      setAsset(loaded);
      setForm({
        categoryId: loaded.categoryId,
        model: loaded.model,
        serialNumber: loaded.serialNumber || "",
        purchaseDate: loaded.purchaseDate ? loaded.purchaseDate.slice(0, 10) : "",
        status: loaded.status,
        location: loaded.location || "",
        locationId: loaded.locationId || "",
        currentUserId: loaded.currentUserId || "",
        customNumber: loaded.customNumber || "",
        vendorAssetNumber: loaded.vendorAssetNumber || ""
      });
    }
    void loadAsset();
  }, [assetId]);

  async function saveAsset(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch(assetId ? `/api/assets/${assetId}` : "/api/assets", {
      method: assetId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Unable to save asset.");
      return;
    }
    setAsset(data.asset);
    if (!assetId) {
      router.replace(`/assets/${data.asset.id}`);
      return;
    }
    setMessage("Asset updated.");
  }

  async function uploadPhoto(file: File) {
    if (!asset) return;
    const data = new FormData();
    data.set("photo", file);
    const response = await fetch(`/api/assets/${asset.id}/photo`, { method: "POST", body: data });
    const result = await response.json();
    if (response.ok) {
      setAsset(result.asset);
    }
    setMessage("Photo uploaded.");
  }

  async function deleteAsset() {
    if (!asset || deleteConfirmation !== "DELETE") return;
    setDeleting(true);
    setMessage("");
    const response = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(typeof data?.error === "string" ? data.error : "Unable to delete asset.");
      return;
    }
    router.replace("/assets");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-8">
      <form onSubmit={saveAsset} className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{asset ? asset.internalNumber : assetId ? "Asset details" : "New asset"}</h2>
            <p className="text-sm text-slate-500">{assetId ? "Edit asset details, photo, and QR link." : "Create an asset record."}</p>
          </div>
          {asset ? (
            <Link className="rounded-md border border-line px-3 py-2 text-sm font-medium" href={`/a/${asset.internalNumber}`} target="_blank">
              QR link
            </Link>
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
          <label className="text-sm font-medium">
            Purchase date
            <input className="mt-1 w-full rounded-md border border-line px-3 py-2" type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
          </label>
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
          <div className="md:col-span-2">
            <p className="text-sm font-medium">Photos</p>
            <button
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              type="button"
              disabled={!asset}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={18} />
              Take photo
            </button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              disabled={!asset}
              onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])}
            />
            {asset?.photos?.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {asset.photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-md border border-line bg-slate-50">
                    {photo.file.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.file.publicUrl} alt={photo.file.originalFilename} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="grid aspect-square place-items-center p-3 text-center text-xs text-slate-500">
                        {photo.file.originalFilename}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{asset ? "No photos yet." : "Save the asset before taking photos."}</p>
            )}
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        <button className="mt-4 w-full rounded-md bg-action px-4 py-2.5 font-semibold text-white" disabled={saving}>
          {saving ? "Saving..." : assetId ? "Update asset" : "Create asset"}
        </button>
      </form>
      {canDelete ? (
        <section className="mt-4 rounded-lg border border-red-200 bg-white p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
              <Trash2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-red-700">Delete asset</h3>
              <p className="mt-1 text-sm text-slate-600">
                This removes the asset, history, map placement, and photo links from the system. Uploaded files are left in storage.
              </p>
            </div>
          </div>
          <label className="mt-4 block text-sm font-medium">
            Type DELETE to confirm
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            type="button"
            disabled={deleteConfirmation !== "DELETE" || deleting}
            onClick={deleteAsset}
          >
            <Trash2 size={18} />
            {deleting ? "Deleting..." : "Delete asset"}
          </button>
        </section>
      ) : null}
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
      <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}
