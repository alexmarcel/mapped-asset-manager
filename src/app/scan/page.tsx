import { ProtectedPage } from "@/components/protected-page";
import { ScanScreen } from "@/components/scan-screen";

export default async function ScanPage() {
  return <ProtectedPage>{() => <ScanScreen />}</ProtectedPage>;
}
