"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, ChevronRight, ExternalLink, FileText, Printer, QrCode, Trash2, Upload } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { AssetRecord, BootstrapData, CurrentUser } from "@/lib/types";
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
  const [loadingAsset, setLoadingAsset] = useState(Boolean(assetId));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [removingDocumentId, setRemovingDocumentId] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const canDelete = Boolean(asset && currentUser?.role === "ADMIN");

  useEffect(() => {
    if (!assetId) return;
    async function loadAsset() {
      setLoadingAsset(true);
      const response = await fetch(`/api/assets/${assetId}`);
      const data = await response.json();
      if (!response.ok) {
        setMessage("Asset not found.");
        setLoadingAsset(false);
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
      setLoadingAsset(false);
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

  async function uploadPhotoFiles(files: FileList | File[]) {
    if (!asset) return;
    const selectedFiles = Array.from(files);
    if (!selectedFiles.length) return;

    setUploadingPhotos(true);
    setMessage(selectedFiles.length === 1 ? "Uploading photo..." : `Uploading 1 of ${selectedFiles.length}...`);

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const data = new FormData();
      data.set("photo", selectedFiles[index]);
      const response = await fetch(`/api/assets/${asset.id}/photo`, { method: "POST", body: data });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setUploadingPhotos(false);
        setMessage(typeof result?.error === "string" ? result.error : "Unable to upload photo.");
        return;
      }

      setAsset(result.asset);
      if (index < selectedFiles.length - 1) {
        setMessage(`Uploading ${index + 2} of ${selectedFiles.length}...`);
      }
    }

    setUploadingPhotos(false);
    setMessage(selectedFiles.length === 1 ? "Photo uploaded." : "Photos uploaded.");
  }

  async function uploadDocumentFile(file: File) {
    if (!asset) return;

    setUploadingDocument(true);
    setMessage("Uploading PDF...");

    const data = new FormData();
    data.set("document", file);
    const response = await fetch(`/api/assets/${asset.id}/documents`, { method: "POST", body: data });
    const result = await response.json().catch(() => null);
    setUploadingDocument(false);

    if (!response.ok) {
      setMessage(typeof result?.error === "string" ? result.error : "Unable to upload PDF.");
      return;
    }

    setAsset(result.asset);
    setMessage("PDF attached.");
  }

  async function removeDocument(documentId: string) {
    if (!asset) return;

    setRemovingDocumentId(documentId);
    setMessage("Removing PDF...");
    const response = await fetch(`/api/assets/${asset.id}/documents/${documentId}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setRemovingDocumentId("");

    if (!response.ok) {
      setMessage(typeof result?.error === "string" ? result.error : "Unable to remove PDF.");
      return;
    }

    setAsset(result.asset);
    setMessage("PDF removed.");
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
      {assetId && loadingAsset ? (
        <section className="grid min-h-[360px] place-items-center rounded-lg border border-line bg-white p-8 shadow-soft">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-action" />
            <p className="text-sm font-medium text-slate-600">Loading asset details...</p>
          </div>
        </section>
      ) : null}
      {assetId && !loadingAsset && !asset ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="font-semibold text-ink">Asset details</h2>
          <p className="mt-1 text-sm text-slate-500">{message || "Asset not found."}</p>
        </section>
      ) : null}
      {(!assetId || asset) ? (
        <>
      <section className="mb-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{asset ? asset.internalNumber : assetId ? "Asset details" : "New asset"}</h2>
            <p className="mt-1 text-sm text-slate-500">{assetId ? "Edit asset details, photo, and QR link." : "Create an asset record."}</p>
          </div>
          {asset ? (
            <div className="flex shrink-0 gap-2">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium"
                href={`/a/${asset.internalNumber}`}
                target="_blank"
              >
                <QrCode size={16} />
                QR link
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-white"
                href={`/assets/${asset.id}/print-qr`}
                target="_blank"
              >
                <Printer size={16} />
                Print QR
              </Link>
            </div>
          ) : null}
        </div>
      </section>
      <form onSubmit={saveAsset} className="rounded-lg border border-line bg-white p-4 shadow-soft">
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
            <span className="relative mt-1 block">
              <input
                className="date-input w-full rounded-md border border-line bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action/20"
                type="date"
                value={form.purchaseDate}
                onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })}
              />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            </span>
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
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                type="button"
                disabled={!asset || uploadingPhotos}
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload size={18} />
                Upload photo
              </button>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                type="button"
                disabled={!asset || uploadingPhotos}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={18} />
                Take photo
              </button>
            </div>
            <input
              ref={uploadInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              disabled={!asset || uploadingPhotos}
              onChange={(event) => {
                if (event.target.files) void uploadPhotoFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              disabled={!asset || uploadingPhotos}
              onChange={(event) => {
                if (event.target.files) void uploadPhotoFiles(event.target.files);
                event.target.value = "";
              }}
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
              <p className="mt-2 text-sm text-slate-500">{asset ? "No photos yet." : "Save the asset before adding photos."}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium">PDF attachments</p>
            <button
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              type="button"
              disabled={!asset || uploadingDocument}
              onClick={() => documentInputRef.current?.click()}
            >
              <Upload size={18} />
              {uploadingDocument ? "Uploading..." : "Upload PDF"}
            </button>
            <input
              ref={documentInputRef}
              className="hidden"
              type="file"
              accept=".pdf,application/pdf"
              disabled={!asset || uploadingDocument}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadDocumentFile(file);
                event.target.value = "";
              }}
            />
            {asset?.documents?.length ? (
              <div className="mt-3 space-y-2">
                {asset.documents.map((document) => (
                  <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-slate-50 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-slate-600">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{document.file.originalFilename}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(document.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {document.file.publicUrl ? (
                        <Link
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1.5 text-xs font-medium"
                          href={document.file.publicUrl}
                          target="_blank"
                        >
                          <ExternalLink size={14} />
                          Open
                        </Link>
                      ) : null}
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1.5 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        type="button"
                        disabled={removingDocumentId === document.id}
                        onClick={() => void removeDocument(document.id)}
                      >
                        <Trash2 size={14} />
                        {removingDocumentId === document.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{asset ? "No PDF attachments yet." : "Save the asset before adding PDFs."}</p>
            )}
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        <button className="mt-4 w-full rounded-md bg-action px-4 py-2.5 font-semibold text-white" disabled={saving}>
          {saving ? "Saving..." : assetId ? "Update asset" : "Create asset"}
        </button>
      </form>
      {asset ? <AssetHistoryTimeline asset={asset} bootstrap={bootstrap} /> : null}
      {canDelete ? (
        <section className="mt-4 rounded-lg border border-red-200 bg-white p-4 shadow-soft">
          <button
            className="flex w-full items-center justify-between gap-3 text-left"
            type="button"
            onClick={() => setDeleteOpen((open) => !open)}
          >
            <span className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
                <Trash2 size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-red-700">Delete asset</span>
                <span className="mt-1 block text-sm text-slate-600">
                  This removes the asset, history, map placement, and photo links from the system. Uploaded files are left in storage.
                </span>
              </span>
            </span>
            {deleteOpen ? <ChevronDown className="shrink-0" size={18} /> : <ChevronRight className="shrink-0" size={18} />}
          </button>
          {deleteOpen ? (
            <>
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
            </>
          ) : null}
        </section>
      ) : null}
        </>
      ) : null}
    </main>
  );
}

function AssetHistoryTimeline({ asset, bootstrap }: { asset: AssetRecord; bootstrap: BootstrapData }) {
  const lookup = createHistoryLookup(bootstrap);
  const [history, setHistory] = useState(asset.history || []);
  const [totalHistory, setTotalHistory] = useState(asset._count?.history || asset.history?.length || 0);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const hasMoreHistory = history.length < totalHistory;

  useEffect(() => {
    setHistory(asset.history || []);
    setTotalHistory(asset._count?.history || asset.history?.length || 0);
  }, [asset.id, asset.history, asset._count?.history]);

  async function loadMoreHistory() {
    if (loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    const response = await fetch(`/api/assets/${asset.id}/history?skip=${history.length}`);
    const data = await response.json().catch(() => null);
    setLoadingMoreHistory(false);

    if (!response.ok) return;

    setHistory((current) => [...current, ...(data?.history || [])]);
    if (typeof data?.total === "number") {
      setTotalHistory(data.total);
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4">
        <h3 className="font-semibold">Asset history</h3>
        <p className="text-sm text-slate-500">Latest activity first.</p>
      </div>
      {history.length ? (
        <>
          <div className="space-y-0">
            {history.map((item, index) => (
              <div key={item.id} className="relative grid grid-cols-[20px,1fr] gap-3 pb-5 last:pb-0">
                {index < history.length - 1 ? <span className="absolute left-[9px] top-5 h-full w-px bg-line" /> : null}
                <span className="relative z-10 mt-1 h-5 w-5 rounded-full border-4 border-white bg-action shadow-sm" />
                <div className="min-w-0 rounded-md border border-line bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatHistoryDate(item.createdAt)}</p>
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{historyTitle(item.changeType)}</p>
                      <HistoryDetail item={item} lookup={lookup} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.user ? `${item.user.name} (${item.user.email})` : "System"}</p>
                </div>
              </div>
            ))}
          </div>
          {hasMoreHistory ? (
            <button
              className="mt-4 w-full rounded-md border border-line px-3 py-2 text-sm font-medium"
              type="button"
              disabled={loadingMoreHistory}
              onClick={loadMoreHistory}
            >
              {loadingMoreHistory ? "Loading..." : "Load more history"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-slate-500">
          No history yet.
        </div>
      )}
    </section>
  );
}

function historyTitle(changeType: string) {
  const titles: Record<string, string> = {
    created: "Asset created",
    updated: "Asset updated",
    photo_uploaded: "Photo uploaded",
    document_uploaded: "PDF attached",
    document_removed: "PDF removed",
    map_position_updated: "Map position updated",
    map_position_removed: "Removed from map"
  };
  return titles[changeType] || changeType.replace(/_/g, " ");
}

type HistoryLookup = {
  categories: Map<string, string>;
  locations: Map<string, string>;
  users: Map<string, string>;
};

function createHistoryLookup(bootstrap: BootstrapData): HistoryLookup {
  return {
    categories: new Map(bootstrap.categories.map((category) => [category.id, category.name])),
    locations: new Map(bootstrap.locations.map((location) => [location.id, location.name])),
    users: new Map(bootstrap.users.map((user) => [user.id, `${user.name} (${user.email})`]))
  };
}

function historyDetail(item: NonNullable<AssetRecord["history"]>[number], lookup: HistoryLookup) {
  const before = parseHistoryJson(item.before);
  const after = parseHistoryJson(item.after);

  switch (item.changeType) {
    case "created":
      return "Initial asset record saved.";
    case "updated":
      return assetUpdateChanges(before, after, lookup).length ? "" : "Changes recorded.";
    case "photo_uploaded":
      return filenameFromHistory(after) ? `Uploaded ${filenameFromHistory(after)}.` : "Photo added to asset.";
    case "document_uploaded":
      return filenameFromHistory(after) ? `Attached ${filenameFromHistory(after)}.` : "PDF attached to asset.";
    case "document_removed":
      return filenameFromHistory(before) ? `Removed ${filenameFromHistory(before)}.` : "PDF removed from asset.";
    case "map_position_updated":
      return mapMoveDetail(before, after);
    case "map_position_removed":
      return before && typeof before.x === "number" && typeof before.y === "number"
        ? `Removed from x ${before.x}, y ${before.y}.`
        : "Removed from map.";
    default:
      return "Activity recorded.";
  }
}

function HistoryDetail({ item, lookup }: { item: NonNullable<AssetRecord["history"]>[number]; lookup: HistoryLookup }) {
  if (item.changeType === "updated") {
    const changes = assetUpdateChanges(parseHistoryJson(item.before), parseHistoryJson(item.after), lookup);
    if (changes.length) {
      return (
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {changes.map((change) => (
            <li key={change.label}>
              <span className="font-medium text-slate-700">{change.label}:</span> {change.before} -&gt; {change.after}
            </li>
          ))}
        </ul>
      );
    }
  }

  return <p className="mt-1 text-sm text-slate-600">{historyDetail(item, lookup)}</p>;
}

function parseHistoryJson(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function filenameFromHistory(value: Record<string, unknown> | null) {
  return typeof value?.filename === "string" ? value.filename : "";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const updateFields = [
  { key: "model", label: "Model" },
  { key: "serialNumber", label: "Serial number" },
  { key: "purchaseDate", label: "Purchase date", normalize: normalizeDateValue, format: formatDateValue },
  { key: "status", label: "Status", format: formatStatusValue },
  { key: "locationId", label: "Location", format: formatLocationValue },
  { key: "currentUserId", label: "Current user", format: formatUserValue },
  { key: "customNumber", label: "Custom asset number" },
  { key: "vendorAssetNumber", label: "Vendor asset number" },
  { key: "categoryId", label: "Category", format: formatCategoryValue }
] as const;

function assetUpdateChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null, lookup: HistoryLookup) {
  if (!before || !after) return [];

  return updateFields.flatMap((field) => {
    const normalize = "normalize" in field ? field.normalize : normalizeHistoryValue;
    const beforeRaw = normalize(before[field.key]);
    const afterRaw = normalize(after[field.key]);
    if (beforeRaw === afterRaw) return [];

    const format = "format" in field ? field.format : null;

    return [{
      label: field.label,
      before: format ? format(beforeRaw, lookup) : displayHistoryValue(beforeRaw),
      after: format ? format(afterRaw, lookup) : displayHistoryValue(afterRaw)
    }];
  });
}

function normalizeHistoryValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function normalizeDateValue(value: unknown) {
  const raw = normalizeHistoryValue(value);
  if (!raw) return "";

  const dateOnly = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return dateOnly || raw;
}

function displayHistoryValue(value: string) {
  return value || "None";
}

function formatDateValue(value: string) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatStatusValue(value: string) {
  return value && value in statusLabels ? statusLabels[value as AssetStatusValue] : displayHistoryValue(value);
}

function formatLocationValue(value: string, lookup: HistoryLookup) {
  if (!value) return "None";
  return lookup.locations.get(value) || "Unknown location";
}

function formatUserValue(value: string, lookup: HistoryLookup) {
  if (!value) return "Unassigned";
  return lookup.users.get(value) || "Unknown user";
}

function formatCategoryValue(value: string, lookup: HistoryLookup) {
  if (!value) return "None";
  return lookup.categories.get(value) || "Unknown category";
}

function mapMoveDetail(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const afterPoint = pointLabel(after);
  if (!afterPoint) return "Map position saved.";

  const beforePoint = pointLabel(before);
  if (!beforePoint) return `Placed at ${afterPoint}.`;
  return `Moved from ${beforePoint} to ${afterPoint}.`;
}

function pointLabel(value: Record<string, unknown> | null) {
  if (typeof value?.x !== "number" || typeof value?.y !== "number") return "";
  return `x ${value.x}, y ${value.y}`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
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
