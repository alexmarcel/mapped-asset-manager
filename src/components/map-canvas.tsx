"use client";

import Link from "next/link";
import { Download, Crosshair, Eye, Image as ImageIcon, LocateFixed, Minus, Move, Plus, Search, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Stage, Text } from "react-konva";
import useImage from "use-image";
import type { AssetRecord, FloorMapOption } from "@/lib/types";
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
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

  async function downloadPlanPdf() {
    setExportingPdf(true);
    setExportMessage("");

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas export is not available.");

      canvas.width = map.width;
      canvas.height = map.height;

      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (image) {
        context.globalAlpha = 0.92;
        context.drawImage(image, 0, 0, map.width, map.height);
        context.globalAlpha = 1;
      }

      drawExportTitle(context, map);
      placements.forEach((placement) => drawExportPin(context, placement));

      const imageData = canvas.toDataURL("image/png");
      const orientation: "landscape" | "portrait" = map.width > map.height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const ratio = Math.min(availableWidth / map.width, availableHeight / map.height);
      const outputWidth = map.width * ratio;
      const outputHeight = map.height * ratio;
      const x = (pageWidth - outputWidth) / 2;
      const y = (pageHeight - outputHeight) / 2;

      pdf.addImage(imageData, "PNG", x, y, outputWidth, outputHeight);
      pdf.save(`${slugifyFilename(`${map.site.name}-${map.name}`)}.pdf`);
    } catch {
      setExportMessage("Unable to prepare the PDF. Try again after the map finishes loading.");
    } finally {
      setExportingPdf(false);
    }
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
      <div className="min-w-0">
        <div ref={containerRef} className="map-grid relative w-full min-w-0 max-w-full touch-none overflow-hidden rounded-lg border border-line bg-slate-50">
          <div className="pointer-events-none absolute left-7 top-6 z-10">
            <p className="text-xl font-semibold text-slate-700 sm:text-2xl">{map.site.name} - {map.name}</p>
            {!image ? <p className="mt-1 text-sm text-slate-500">Upload a floor plan image or use this canvas directly.</p> : null}
          </div>
          <Stage
            width={size.width}
            height={size.height}
            draggable
            x={position.x}
            y={position.y}
            scaleX={scale}
            scaleY={scale}
            onDragEnd={(event) => {
              if (event.target !== event.target.getStage()) return;
              setPosition({ x: event.target.x(), y: event.target.y() });
            }}
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
              ) : null}
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
        <button
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
          type="button"
          disabled={exportingPdf}
          onClick={downloadPlanPdf}
        >
          <Download size={16} />
          {exportingPdf ? "Preparing..." : "Download Plan as PDF"}
        </button>
        {exportMessage ? <p className="mt-2 text-sm text-slate-600">{exportMessage}</p> : null}
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
      onDragStart={(event) => {
        event.cancelBubble = true;
        onSelect();
      }}
      onDragMove={(event) => {
        event.cancelBubble = true;
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true;
        onMove(Math.round(event.target.x()), Math.round(event.target.y()));
      }}
    >
      <Circle radius={selected ? 21 : 17} fill={fill} shadowColor="black" shadowBlur={8} shadowOpacity={0.18} />
      {selected ? <Circle radius={25} stroke={fill} strokeWidth={2} /> : null}
      <Text text={placement.asset.category.name.slice(0, 1)} x={-5} y={-8} fontSize={16} fill="white" fontStyle="bold" />
      <Text text={label} x={24} y={-15} fontSize={14} fill="#1f2933" />
      <Text text={statusLabels[placement.asset.status]} x={24} y={2} fontSize={11} fill="#64748b" />
    </Group>
  );
}

function drawExportTitle(context: CanvasRenderingContext2D, map: FloorMapOption) {
  const x = 28;
  const y = 34;

  context.save();
  context.fillStyle = "rgba(248, 250, 252, 0.86)";
  context.fillRect(x - 12, y - 24, Math.min(520, map.width - x), 72);
  context.fillStyle = "#334155";
  context.font = "600 26px Arial, sans-serif";
  context.fillText(`${map.site.name} - ${map.name}`, x, y);
  context.fillStyle = "#64748b";
  context.font = "15px Arial, sans-serif";
  context.fillText("Upload a floor plan image or use this canvas directly.", x, y + 26);
  context.restore();
}

function drawExportPin(context: CanvasRenderingContext2D, placement: Placement) {
  const fill = placement.asset.category.color;
  const label = placement.asset.customNumber || placement.asset.internalNumber;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.18)";
  context.shadowBlur = 8;
  context.fillStyle = fill;
  context.beginPath();
  context.arc(placement.x, placement.y, 17, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.fillStyle = "#ffffff";
  context.font = "700 16px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(placement.asset.category.name.slice(0, 1), placement.x, placement.y + 1);

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#1f2933";
  context.font = "14px Arial, sans-serif";
  context.fillText(label, placement.x + 24, placement.y - 4);
  context.fillStyle = "#64748b";
  context.font = "11px Arial, sans-serif";
  context.fillText(statusLabels[placement.asset.status], placement.x + 24, placement.y + 13);
  context.restore();
}

function slugifyFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "map-plan";
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
