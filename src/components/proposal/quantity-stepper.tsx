import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
  ariaLabel?: string;
};

export function QuantityStepper({
  value,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  onIncrement,
  onDecrement,
  className,
  ariaLabel,
}: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-label={ariaLabel}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
      >
        -
      </Button>
      <span className="min-w-[2ch] text-center text-sm font-medium" aria-live="polite" aria-atomic="true">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onIncrement}
        disabled={!canIncrement}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  );
}
