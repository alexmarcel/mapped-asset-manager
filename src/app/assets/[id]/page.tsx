import { AssetFormScreen } from "@/components/asset-form-screen";
import { ProtectedPage } from "@/components/protected-page";

export default async function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProtectedPage>{(bootstrap, user) => <AssetFormScreen bootstrap={bootstrap} assetId={id} currentUser={user} />}</ProtectedPage>;
}
