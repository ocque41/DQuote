import { ReactNode } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

import { AddOnToggle } from "./add-on-toggle";
import { QuantityStepper } from "./quantity-stepper";
import { RuntimeOption } from "./types";

type OptionCardProps = {
  option: RuntimeOption;
  currency: string;
  quantity: number;
  onSelect?: () => void;
  onToggle?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  footer?: ReactNode;
};

export function OptionCard({ option, currency, quantity, onSelect, onToggle, onIncrement, onDecrement, footer }: OptionCardProps) {
  const price = option.priceOverride ?? option.catalogItem?.unitPrice ?? 0;
  const isSelected = quantity > 0;
  const tags = option.catalogItem?.tags ?? [];
  const minQty = option.minQty ?? 0;
  const maxQty = option.maxQty ?? 5;
  const displayName = option.catalogItem?.name ?? option.description ?? "Custom option";
  const description = option.catalogItem?.description ?? option.description;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col justify-between border-2 transition",
        isSelected ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">{formatCurrency(Number(price), currency)}</p>
        {option.isAddOn && onToggle ? (
          <AddOnToggle selected={isSelected} onToggle={onToggle} />
        ) : null}
        {!option.isAddOn && onSelect ? (
          <Button className="w-full" onClick={onSelect} variant={isSelected ? "default" : "outline"}>
            {isSelected ? "Selected" : "Choose"}
          </Button>
        ) : null}
        {!option.isAddOn && isSelected && onIncrement && onDecrement ? (
          <QuantityStepper
            value={quantity}
            min={minQty}
            max={maxQty ?? Number.POSITIVE_INFINITY}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            className="ml-auto"
          />
        ) : null}
        {!option.isAddOn && tags.length ? (
          <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
        {footer}
      </CardContent>
      {option.isDefault ? (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
          <Check className="h-3 w-3" /> Recommended
        </span>
      ) : null}
    </Card>
  );
}
