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
  theme?: {
    brandColor: string;
    brandSurface: string;
    brandForeground: string;
    accentColor: string;
    accentForeground: string;
  };
};

export function OptionCard({
  option,
  currency,
  quantity,
  onSelect,
  onToggle,
  onIncrement,
  onDecrement,
  footer,
  theme,
}: OptionCardProps) {
  const price = option.priceOverride ?? option.catalogItem?.unitPrice ?? 0;
  const isSelected = quantity > 0;
  const tags = option.catalogItem?.tags ?? [];
  const minQty = option.minQty ?? 0;
  const maxQty = option.maxQty ?? 5;
  const displayName = option.catalogItem?.name ?? option.description ?? "Custom option";
  const description = option.catalogItem?.description ?? option.description;
  const cardStyle = isSelected && theme ? { borderColor: theme.brandColor, backgroundColor: theme.brandSurface } : undefined;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col justify-between border-2 transition focus-within:ring-2",
        isSelected ? "border-transparent" : "border-border"
      )}
      tabIndex={-1}
      style={cardStyle}
    >
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">{formatCurrency(Number(price), currency)}</p>
        {option.isAddOn && onToggle ? (
          <AddOnToggle
            selected={isSelected}
            onToggle={onToggle}
            accentColor={theme?.accentColor}
            accentForeground={theme?.accentForeground}
          />
        ) : null}
        {!option.isAddOn && onSelect ? (
          <Button
            className="w-full"
            onClick={onSelect}
            variant={isSelected ? "default" : "outline"}
            style={
              isSelected
                ? {
                    backgroundColor: theme?.brandColor,
                    color: theme?.brandForeground,
                  }
                : undefined
            }
            aria-pressed={isSelected}
          >
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
            ariaLabel={`${displayName} quantity`}
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
        <span
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs"
          style={{
            backgroundColor: theme?.accentColor,
            color: theme?.accentForeground,
          }}
        >
          <Check className="h-3 w-3" /> Recommended
        </span>
      ) : null}
    </Card>
  );
}
