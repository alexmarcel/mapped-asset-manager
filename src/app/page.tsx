import { RedirectIfAuthed } from "@/components/protected-page";

export default async function HomePage() {
  return <RedirectIfAuthed />;
}
