import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBootstrapData } from "@/lib/bootstrap";
import { type AssetStatusValue, statusLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { LoginCard } from "@/components/login-card";

export default async function AssetQrPage({ params }: { params: Promise<{ assetNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <LoginCard />;

  const { assetNumber } = await params;
  const [asset, bootstrap] = await Promise.all([
    prisma.asset.findUnique({
      where: { internalNumber: decodeURIComponent(assetNumber) },
      include: {
        category: true,
        locationRef: true,
        currentUser: { select: { id: true, name: true, email: true, contact: true } },
        photoFile: true,
        photos: {
          include: { file: true },
          orderBy: { createdAt: "desc" }
        },
        placements: {
          include: { map: { include: { site: true } } },
          orderBy: { updatedAt: "desc" }
        },
        history: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    getBootstrapData()
  ]);

  if (!asset) notFound();

  const lookup = {
    categories: new Map(bootstrap.categories.map((category) => [category.id, category.name])),
    locations: new Map(bootstrap.locations.map((location) => [location.id, location.name])),
    users: new Map(bootstrap.users.map((item) => [item.id, `${item.name} (${item.email})`]))
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-8">
      <div className="mb-3 flex justify-end">
        <Link className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium shadow-soft" href={`/assets/${asset.id}`}>
          Edit asset
        </Link>
      </div>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Asset</p>
            <h1 className="text-2xl font-semibold">{asset.customNumber || asset.internalNumber}</h1>
            {asset.customNumber ? <p className="text-sm text-slate-500">{asset.internalNumber}</p> : null}
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium">{statusLabels[asset.status as AssetStatusValue] || asset.status}</span>
        </div>

        <dl className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadOnlyField label="Model" value={asset.model} />
          <ReadOnlyField label="Category" value={asset.category.name} />
          <ReadOnlyField label="Serial number" value={asset.serialNumber} />
          <ReadOnlyField label="Vendor asset number" value={asset.vendorAssetNumber} />
          <ReadOnlyField label="Custom asset number" value={asset.customNumber} />
          <ReadOnlyField label="Purchase date" value={formatDateValue(asset.purchaseDate)} />
          <ReadOnlyField label="Location" value={asset.locationRef?.name || asset.location} />
          <ReadOnlyField label="Current user" value={asset.currentUser ? `${asset.currentUser.name} (${asset.currentUser.email})` : "Unassigned"} />
          <ReadOnlyField label="Created" value={formatHistoryDate(asset.createdAt)} />
          <ReadOnlyField label="Last updated" value={formatHistoryDate(asset.updatedAt)} />
        </dl>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <h2 className="font-semibold">Photos</h2>
        {asset.photos.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {asset.photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-md border border-line bg-slate-50">
                {photo.file.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.file.publicUrl} alt={photo.file.originalFilename} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="grid aspect-square place-items-center p-3 text-center text-xs text-slate-500">{photo.file.originalFilename}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No photos yet.</p>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <h2 className="font-semibold">Map locations</h2>
        {asset.placements.length ? (
          <div className="mt-3 space-y-2">
            {asset.placements.map((placement) => (
              <div key={placement.id} className="rounded-md border border-line bg-slate-50 p-3 text-sm">
                <p className="font-medium">
                  {placement.map.site.name} - {placement.map.name}
                </p>
                <p className="mt-1 text-slate-500">
                  x {Math.round(placement.x)}, y {Math.round(placement.y)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Not placed on a map yet.</p>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4">
          <h2 className="font-semibold">Asset history</h2>
          <p className="text-sm text-slate-500">Latest activity first.</p>
        </div>
        {asset.history.length ? (
          <div>
            {asset.history.map((item, index) => (
              <div key={item.id} className="relative grid grid-cols-[20px,1fr] gap-3 pb-5 last:pb-0">
                {index < asset.history.length - 1 ? <span className="absolute left-[9px] top-5 h-full w-px bg-line" /> : null}
                <span className="relative z-10 mt-1 h-5 w-5 rounded-full border-4 border-white bg-action shadow-sm" />
                <div className="min-w-0 rounded-md border border-line bg-slate-50 p-3">
                  <p className="font-medium">{formatHistoryDate(item.createdAt)}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{historyTitle(item.changeType)}</p>
                  <HistoryDetail item={item} lookup={lookup} />
                  <p className="mt-2 text-xs text-slate-500">{item.user ? `${item.user.name} (${item.user.email})` : "System"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-slate-500">No history yet.</div>
        )}
      </section>
    </main>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | number | Date | null | undefined }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value ? String(value) : "None"}</dd>
    </div>
  );
}

type HistoryLookup = {
  categories: Map<string, string>;
  locations: Map<string, string>;
  users: Map<string, string>;
};

type HistoryItem = {
  changeType: string;
  before: string | null;
  after: string | null;
};

function HistoryDetail({ item, lookup }: { item: HistoryItem; lookup: HistoryLookup }) {
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

function historyTitle(changeType: string) {
  const titles: Record<string, string> = {
    created: "Asset created",
    updated: "Asset updated",
    photo_uploaded: "Photo uploaded",
    map_position_updated: "Map position updated",
    map_position_removed: "Removed from map"
  };
  return titles[changeType] || changeType.replace(/_/g, " ");
}

function historyDetail(item: HistoryItem, lookup: HistoryLookup) {
  const before = parseHistoryJson(item.before);
  const after = parseHistoryJson(item.after);

  switch (item.changeType) {
    case "created":
      return "Initial asset record saved.";
    case "updated":
      return assetUpdateChanges(before, after, lookup).length ? "" : "Changes recorded.";
    case "photo_uploaded":
      return filenameFromHistory(after) ? `Uploaded ${filenameFromHistory(after)}.` : "Photo added to asset.";
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

    return [{
      label: field.label,
      before: field.format ? field.format(beforeRaw, lookup) : displayHistoryValue(beforeRaw),
      after: field.format ? field.format(afterRaw, lookup) : displayHistoryValue(afterRaw)
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

function formatDateValue(value: string | Date | null, _lookup?: HistoryLookup) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatStatusValue(value: string, _lookup?: HistoryLookup) {
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

function formatHistoryDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
