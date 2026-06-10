import { AssetListScreen } from "@/components/asset-list-screen";
import { ProtectedPage } from "@/components/protected-page";

export default async function AssetsPage() {
  return <ProtectedPage>{(bootstrap) => <AssetListScreen bootstrap={bootstrap} />}</ProtectedPage>;
}
