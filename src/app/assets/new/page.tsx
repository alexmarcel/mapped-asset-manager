import { AssetFormScreen } from "@/components/asset-form-screen";
import { ProtectedPage } from "@/components/protected-page";

export default async function NewAssetPage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const { categoryId } = await searchParams;
  return <ProtectedPage>{(bootstrap) => <AssetFormScreen bootstrap={bootstrap} initialCategoryId={categoryId} />}</ProtectedPage>;
}
