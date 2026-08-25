import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LessonView } from "@/components/learn/lesson-view";

export const Route = createFileRoute("/learn")({ component: LearnPage });

function LearnPage() {
  return (
    <AppShell>
      <LessonView />
    </AppShell>
  );
}
