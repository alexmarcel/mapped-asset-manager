import QRCode from "qrcode";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginCard } from "@/components/login-card";
import { PrintOnLoad } from "@/components/print-on-load";

function appUrlFromHeaders(host: string | null, protocol: string | null) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (!host) return "";
  return `${protocol || "http"}://${host}`;
}

export default async function PrintAssetQrPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <LoginCard />;

  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!asset) notFound();

  const requestHeaders = await headers();
  const baseUrl = appUrlFromHeaders(requestHeaders.get("host"), requestHeaders.get("x-forwarded-proto"));
  const qrUrl = `${baseUrl}/a/${encodeURIComponent(asset.internalNumber)}`;
  const qrImage = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360
  });

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-900 print:min-h-0 print:p-0">
      <style>{`
        @page {
          size: 62mm 45mm;
          margin: 4mm;
        }
      `}</style>
      <div className="mx-auto flex max-w-sm justify-end print:hidden">
        <PrintOnLoad />
      </div>
      <section className="mx-auto mt-4 w-full max-w-sm rounded-lg border border-slate-300 bg-white p-4 text-center print:m-0 print:max-w-none print:border-0 print:p-0">
        <div className="mx-auto h-48 w-48 print:h-32 print:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage} alt={`QR code for ${asset.internalNumber}`} className="h-full w-full" />
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-normal print:mt-2 print:text-base">{asset.customNumber || asset.internalNumber}</h1>
        {asset.customNumber ? <p className="text-sm font-semibold print:text-xs">{asset.internalNumber}</p> : null}
        <p className="mt-1 text-sm print:text-xs">{asset.model}</p>
        <p className="text-xs text-slate-600 print:text-[10px]">{asset.category.name}</p>
      </section>
    </main>
  );
}
