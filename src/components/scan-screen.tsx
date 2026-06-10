"use client";

import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, QrCode, Square } from "lucide-react";

export function ScanScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [assetNumber, setAssetNumber] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader();
    return () => stopScanner();
  }, []);

  function openAssetNumber(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      const url = new URL(trimmed);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const qrAssetNumber = pathParts[0] === "a" ? pathParts[1] : "";
      window.location.href = qrAssetNumber ? `/a/${encodeURIComponent(qrAssetNumber)}` : trimmed;
    } catch {
      window.location.href = `/a/${encodeURIComponent(trimmed)}`;
    }
  }

  function openAsset(event: FormEvent) {
    event.preventDefault();
    openAssetNumber(assetNumber);
  }

  async function startScanner() {
    if (!videoRef.current || !readerRef.current) return;

    setMessage("");

    try {
      controlsRef.current = await readerRef.current.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" }
          },
          audio: false
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            stopScanner();
            openAssetNumber(result.getText());
            return;
          }

          if (error && error.name !== "NotFoundException") {
            setMessage("Camera is active. Keep the QR code inside the frame.");
          }
        }
      );
      setCameraActive(true);
    } catch {
      setMessage("Camera permission was denied or no camera is available.");
      setCameraActive(false);
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraActive(false);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-24 pt-4 md:pb-8">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-action text-white">
            <QrCode size={22} />
          </div>
          <div>
            <h2 className="font-semibold">QR Scanner</h2>
            <p className="text-sm text-slate-500">Scan an asset QR label with the camera.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-slate-950">
          <div className="relative aspect-[4/3]">
            <video ref={videoRef} className="size-full object-cover" muted playsInline />
            {!cameraActive ? (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-slate-300">
                Start the scanner to use the camera.
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/80" />
                <div className="pointer-events-none absolute inset-x-10 top-1/2 h-0.5 bg-action shadow-[0_0_18px_rgba(15,118,110,0.95)]" />
              </>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-3 py-2.5 font-semibold text-white disabled:bg-slate-300"
            type="button"
            onClick={startScanner}
            disabled={cameraActive}
          >
            <Camera size={18} />
            Start scan
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2.5 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
            type="button"
            onClick={stopScanner}
            disabled={!cameraActive}
          >
            <Square size={17} />
            Stop
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}

        <form onSubmit={openAsset} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            Manual asset number
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              placeholder="IT-000001"
              value={assetNumber}
              onChange={(event) => setAssetNumber(event.target.value)}
            />
          </label>
          <button className="w-full rounded-md bg-action px-4 py-2.5 font-semibold text-white">Open asset</button>
        </form>
      </section>
    </main>
  );
}
