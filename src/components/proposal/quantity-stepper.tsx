import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
};

export function QuantityStepper({ value, min = 0, max = Number.POSITIVE_INFINITY, onIncrement, onDecrement, className }: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onDecrement} disabled={!canDecrement}>
        -
      </Button>
      <span className="min-w-[2ch] text-center text-sm font-medium">{value}</span>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onIncrement} disabled={!canIncrement}>
        +
      </Button>
    </div>
  );
}
