import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { EngineBay } from "@/components/engine/engine-bay";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell lock>
      <EngineBay />
    </AppShell>
  );
}
