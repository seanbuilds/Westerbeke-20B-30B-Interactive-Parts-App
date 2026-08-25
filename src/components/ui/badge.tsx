import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & { tone?: "default" | "ok" | "warn" | "primary" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "default" && "bg-raised text-muted",
        tone === "ok" && "bg-ok text-ok-fg",
        tone === "warn" && "bg-warn text-bg",
        tone === "primary" && "bg-primary text-primary-fg",
        className,
      )}
      {...props}
    />
  );
}
