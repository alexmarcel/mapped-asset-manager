"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssetRecord, BootstrapData, CurrentUser } from "@/lib/types";
import { SelectField } from "@/components/ui/select-field";

const MapCanvas = dynamic(() => import("@/components/map-canvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="grid h-[520px] place-items-center rounded-lg border border-line bg-white">Loading map...</div>
});

export function MapScreen({ bootstrap, user }: { bootstrap: BootstrapData; user: CurrentUser }) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [activeMapId, setActiveMapId] = useState(bootstrap.maps[0]?.id || "");
  const [siteName, setSiteName] = useState("");
  const [mapName, setMapName] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const loadAssets = useCallback(async () => {
    const response = await fetch("/api/assets");
    const data = await response.json();
    setAssets(data.assets || []);
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const activeMap = useMemo(
    () => bootstrap.maps.find((map) => map.id === activeMapId) || bootstrap.maps[0],
    [activeMapId, bootstrap.maps]
  );

  async function createMap() {
    if (user.role !== "ADMIN") return;
    setCreating(true);
    setMessage("");
    const response = await fetch("/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteName, name: mapName })
    });
    const data = await response.json();
    setCreating(false);
    if (!response.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Unable to create map.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-24 pt-4 md:pb-8">
      {user.role === "ADMIN" ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="font-semibold">Map setup</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr,1fr,160px]">
            <input
              className="rounded-md border border-line px-3 py-2 text-sm"
              placeholder="Site name"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              disabled={creating}
            />
            <input
              className="rounded-md border border-line px-3 py-2 text-sm"
              placeholder="Floor or map name"
              value={mapName}
              onChange={(event) => setMapName(event.target.value)}
              disabled={creating}
            />
            <button
              className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              type="button"
              disabled={!siteName.trim() || !mapName.trim() || creating}
              onClick={createMap}
            >
              {creating ? "Creating..." : "Create map"}
            </button>
          </div>
          {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
        </section>
      ) : null}
      <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Location Map</h2>
            <p className="text-sm text-slate-500">Pan, zoom, upload floor plans, and drag asset pins.</p>
          </div>
          <div className="w-full max-w-sm">
            <SelectField
              value={activeMapId}
              onChange={setActiveMapId}
              options={bootstrap.maps.map((map) => ({ value: map.id, label: `${map.site.name} - ${map.name}` }))}
            />
          </div>
        </div>
        {activeMap ? <MapCanvas map={activeMap} assets={assets} /> : <div className="rounded-md border border-line p-6 text-sm text-slate-500">Create a floor map to place assets.</div>}
      </section>
    </main>
  );
}
