"use client";

import Link from "next/link";
import { Crosshair, Eye, Image as ImageIcon, LocateFixed, Minus, Move, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Stage, Text } from "react-konva";
import useImage from "use-image";
import type { AssetRecord, FloorMapOption } from "@/components/asset-workspace";
import { assetStatuses, statusLabels, type AssetStatusValue } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { SelectField } from "@/components/ui/select-field";

type Placement = {
  id: string;
  x: number;
  y: number;
  asset: AssetRecord;
};

export function MapCanvas({ map, assets }: { map: FloorMapOption; assets: AssetRecord[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 420 });
  const [scale, setScale] = useState(0.7);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [image] = useImage(map.imageFile?.publicUrl || "", "anonymous");

  useEffect(() => {
    const update = () => {
      const measuredWidth = containerRef.current?.clientWidth || window.innerWidth - 32;
      const width = Math.max(280, Math.floor(measuredWidth));
      setSize({ width, height: width < 720 ? 420 : 520 });
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("orientationchange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const loadPlacements = useCallback(async () => {
    const response = await fetch(`/api/maps/${map.id}/assets`);
    const data = await response.json();
    setPlacements(data.placements || []);
  }, [map.id]);

  useEffect(() => {
    void loadPlacements();
  }, [loadPlacements]);

  async function savePlacement(assetId: string, x: number, y: number) {
    const response = await fetch(`/api/maps/${map.id}/placements/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y })
    });
    if (!response.ok) {
      await loadPlacements();
    }
  }

  async function uploadMapImage(file: File) {
    const data = new FormData();
    data.set("image", file);
    const dimensions = await getImageDimensions(file).catch(() => null);
    if (dimensions) {
      data.set("width", String(dimensions.width));
      data.set("height", String(dimensions.height));
    }
    await fetch(`/api/maps/${map.id}/image`, { method: "POST", body: data });
    window.location.reload();
  }

  async function removePlacement(assetId: string) {
    const previous = placements;
    setPlacements((current) => current.filter((placement) => placement.asset.id !== assetId));
    setSelectedAssetId("");
    const response = await fetch(`/api/maps/${map.id}/placements/${assetId}`, { method: "DELETE" });
    if (!response.ok) {
      setPlacements(previous);
    }
  }

  function placeAsset(asset: AssetRecord) {
    const x = Math.round((size.width / 2 - position.x) / scale);
    const y = Math.round((size.height / 2 - position.y) / scale);
    setPlacements((current) => [...current, { id: asset.id, x, y, asset }]);
    setSelectedAssetId(asset.id);
    void savePlacement(asset.id, x, y);
  }

  function focusPlacement(placement: Placement) {
    setScale(1);
    setPosition({
      x: Math.round(size.width / 2 - placement.x),
      y: Math.round(size.height / 2 - placement.y)
    });
    setSelectedAssetId(placement.asset.id);
  }

  function resetView() {
    setScale(0.7);
    setPosition({ x: 40, y: 40 });
  }

  const placedAssetIds = useMemo(() => new Set(placements.map((placement) => placement.asset.id)), [placements]);
  const normalizedQuery = assetQuery.trim().toLowerCase();
  const unplaced = useMemo(
    () =>
      assets.filter((asset) => {
        if (placedAssetIds.has(asset.id) || asset.status === "disposed") return false;
        if (categoryId && asset.categoryId !== categoryId) return false;
        if (status && asset.status !== status) return false;
        if (!normalizedQuery) return true;
        return [
          asset.internalNumber,
          asset.customNumber || "",
          asset.vendorAssetNumber || "",
          asset.model,
          asset.serialNumber || "",
          asset.currentUser?.name || "",
          asset.locationRef?.name || asset.location || "",
          asset.category.name
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [assets, categoryId, normalizedQuery, placedAssetIds, status]
  );
  const selectedPlacement = placements.find((placement) => placement.asset.id === selectedAssetId);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium">
          <ImageIcon size={16} />
          Upload map
          <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadMapImage(event.target.files[0])} />
        </label>
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-slate-600">
          <Move size={16} /> Scroll to zoom. Drag canvas or pins.
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setScale((value) => Math.max(0.25, value - 0.15))}>
          <Minus size={16} /> Zoom
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setScale((value) => Math.min(2.4, value + 0.15))}>
          <Plus size={16} /> Zoom
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={resetView}>
          <Crosshair size={16} /> Reset
        </button>
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr),320px]">
      <div ref={containerRef} className="map-grid w-full min-w-0 max-w-full touch-none overflow-hidden rounded-lg border border-line bg-slate-50">
        <Stage
          width={size.width}
          height={size.height}
          draggable
          x={position.x}
          y={position.y}
          scaleX={scale}
          scaleY={scale}
          onDragEnd={(event) => setPosition({ x: event.target.x(), y: event.target.y() })}
          onPointerDown={(event) => {
            if (event.target === event.target.getStage()) setSelectedAssetId("");
          }}
          onWheel={(event) => {
            event.evt.preventDefault();
            const next = Math.min(2.4, Math.max(0.25, scale + (event.evt.deltaY > 0 ? -0.08 : 0.08)));
            setScale(next);
          }}
        >
          <Layer>
            {image ? (
              <KonvaImage image={image} x={0} y={0} width={map.width} height={map.height} opacity={0.92} />
            ) : (
              <>
                <Text x={36} y={34} text={`${map.site.name} - ${map.name}`} fontSize={32} fill="#334155" />
                <Text x={38} y={78} text="Upload a floor plan image or use this canvas directly." fontSize={17} fill="#64748b" />
              </>
            )}
            {placements.map((placement) => (
              <AssetPin
                key={placement.asset.id}
                placement={placement}
                selected={placement.asset.id === selectedAssetId}
                onSelect={() => setSelectedAssetId(placement.asset.id)}
                onMove={(x, y) => {
                  setPlacements((current) =>
                    current.map((item) => (item.asset.id === placement.asset.id ? { ...item, x, y } : item))
                  );
                  void savePlacement(placement.asset.id, x, y);
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <aside className="min-w-0 rounded-lg border border-line bg-white p-3">
        {selectedPlacement ? (
          <div className="mb-3 rounded-md border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{selectedPlacement.asset.customNumber || selectedPlacement.asset.internalNumber}</p>
                <p className="truncate text-sm text-slate-600">{selectedPlacement.asset.model}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium" style={{ background: `${selectedPlacement.asset.category.color}22`, color: selectedPlacement.asset.category.color }}>
                <CategoryIcon name={selectedPlacement.asset.category.icon} color={selectedPlacement.asset.category.color} size={14} />
                {selectedPlacement.asset.category.name}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {statusLabels[selectedPlacement.asset.status]} - {selectedPlacement.asset.currentUser?.name || "Unassigned"} - {selectedPlacement.asset.locationRef?.name || selectedPlacement.asset.location || "No location"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link className="inline-flex items-center justify-center gap-1 rounded-md border border-line px-2 py-2 text-xs font-medium" href={`/assets/${selectedPlacement.asset.id}`}>
                <Eye size={14} /> View
              </Link>
              <button className="inline-flex items-center justify-center gap-1 rounded-md border border-line px-2 py-2 text-xs font-medium" type="button" onClick={() => focusPlacement(selectedPlacement)}>
                <LocateFixed size={14} /> Locate
              </button>
              <button className="inline-flex items-center justify-center gap-1 rounded-md border border-line px-2 py-2 text-xs font-medium text-red-600" type="button" onClick={() => removePlacement(selectedPlacement.asset.id)}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="font-semibold">Add asset</h3>
          <div className="mt-2 grid gap-2">
            <label className="relative block min-w-0">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <input
                className="w-full rounded-md border border-line py-2 pl-9 pr-3 text-sm"
                placeholder="Search unplaced assets"
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <SelectField
                value={categoryId || "__all__"}
                onChange={(value) => setCategoryId(value === "__all__" ? "" : value)}
                options={[
                  { value: "__all__", label: "All categories" },
                  ...Array.from(new Map(assets.map((asset) => [asset.categoryId, asset.category])).values()).map((category) => ({
                    value: category.id,
                    label: category.name
                  }))
                ]}
              />
              <SelectField
                value={status || "__all__"}
                onChange={(value) => setStatus(value === "__all__" ? "" : value)}
                options={[
                  { value: "__all__", label: "All status" },
                  ...assetStatuses.map((value) => ({ value, label: statusLabels[value as AssetStatusValue] }))
                ]}
              />
            </div>
          </div>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
            {unplaced.map((asset) => (
              <div key={asset.id} className="rounded-md border border-line p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{asset.customNumber || asset.internalNumber}</p>
                    <p className="truncate text-xs text-slate-500">{asset.model}</p>
                  </div>
                  <CategoryIcon name={asset.category.icon} color={asset.category.color} size={18} />
                </div>
                <button className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs font-medium" type="button" onClick={() => placeAsset(asset)}>
                  Place on map
                </button>
              </div>
            ))}
            {!unplaced.length ? (
              <div className="rounded-md border border-dashed border-line p-4 text-center text-sm text-slate-500">
                No matching unplaced assets.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}

function AssetPin({
  placement,
  selected,
  onSelect,
  onMove
}: {
  placement: Placement;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const fill = placement.asset.category.color;
  const label = placement.asset.customNumber || placement.asset.internalNumber;

  return (
    <Group
      x={placement.x}
      y={placement.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => onMove(Math.round(event.target.x()), Math.round(event.target.y()))}
    >
      <Circle radius={selected ? 21 : 17} fill={fill} shadowColor="black" shadowBlur={8} shadowOpacity={0.18} />
      {selected ? <Circle radius={25} stroke={fill} strokeWidth={2} /> : null}
      <Text text={placement.asset.category.name.slice(0, 1)} x={-5} y={-8} fontSize={16} fill="white" fontStyle="bold" />
      <Text text={label} x={24} y={-15} fontSize={14} fill="#1f2933" />
      <Text text={statusLabels[placement.asset.status]} x={24} y={2} fontSize={11} fill="#64748b" />
    </Group>
  );
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image dimensions"));
    };
    image.src = url;
  });
}
