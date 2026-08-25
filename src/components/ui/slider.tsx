import { cn } from "@/lib/utils";

export function Slider({
  className,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onValueChange,
}: {
  className?: string;
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number[]) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] ?? min}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={cn(
        "h-6 w-full cursor-pointer appearance-none bg-transparent accent-primary",
        className,
      )}
    />
  );
}
