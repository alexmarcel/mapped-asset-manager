import { AssetListScreen } from "@/components/asset-list-screen";
import { ProtectedPage } from "@/components/protected-page";

export default async function CategoryAssetsPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return (
    <ProtectedPage>
      {(bootstrap) => <AssetListScreen bootstrap={bootstrap} categoryId={categoryId} showCategoryCard={false} />}
    </ProtectedPage>
  );
}
