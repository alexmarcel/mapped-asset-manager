import { MapScreen } from "@/components/map-screen";
import { ProtectedPage } from "@/components/protected-page";

export default async function MapPage() {
  return <ProtectedPage>{(bootstrap, user) => <MapScreen bootstrap={bootstrap} user={user} />}</ProtectedPage>;
}
