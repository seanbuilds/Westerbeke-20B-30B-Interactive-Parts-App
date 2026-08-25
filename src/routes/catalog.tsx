import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogView } from "@/components/catalog/catalog-view";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

function CatalogPage() {
  return (
    <AppShell>
      <CatalogView />
    </AppShell>
  );
}
