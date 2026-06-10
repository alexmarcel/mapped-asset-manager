import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { CurrentUser } from "@/components/asset-workspace";
import { AppShell } from "@/components/app-shell";
import { LoginCard } from "@/components/login-card";
import { getCurrentUser } from "@/lib/auth";
import { getBootstrapData } from "@/lib/bootstrap";

export async function ProtectedPage({
  children
}: {
  children: (props: Awaited<ReturnType<typeof getBootstrapData>>, user: CurrentUser) => ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) return <LoginCard />;

  const bootstrap = await getBootstrapData();
  return <AppShell user={user}>{children(bootstrap, user)}</AppShell>;
}

export async function RedirectIfAuthed() {
  const user = await getCurrentUser();
  if (!user) return <LoginCard />;
  redirect("/assets");
}
