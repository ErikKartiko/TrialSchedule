import { ensureAdminExists } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await ensureAdminExists();
  } catch {
    // DB might not be ready yet
  }
  return <AppShell />;
}
