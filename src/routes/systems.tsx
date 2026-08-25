import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { SystemBoard } from "@/components/systems/system-board";

export const Route = createFileRoute("/systems")({ component: SystemsPage });

function SystemsPage() {
  return (
    <AppShell>
      <SystemBoard />
    </AppShell>
  );
}
