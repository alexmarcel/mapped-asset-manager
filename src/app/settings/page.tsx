import { ProtectedPage } from "@/components/protected-page";
import { SettingsScreen } from "@/components/settings-screen";

export default async function SettingsPage() {
  return <ProtectedPage>{(bootstrap, user) => <SettingsScreen bootstrap={bootstrap} user={user} />}</ProtectedPage>;
}
