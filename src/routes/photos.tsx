import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PhotoExplorer } from "@/components/photos/photo-explorer";

export const Route = createFileRoute("/photos")({ component: PhotosPage });

function PhotosPage() {
  return (
    <AppShell>
      <PhotoExplorer />
    </AppShell>
  );
}
