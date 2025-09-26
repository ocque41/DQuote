import { Button } from "@/components/ui/button";

type AddOnToggleProps = {
  selected: boolean;
  onToggle: () => void;
  accentColor?: string;
  accentForeground?: string;
};

export function AddOnToggle({ selected, onToggle, accentColor, accentForeground }: AddOnToggleProps) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className="w-full"
      onClick={onToggle}
      aria-pressed={selected}
      style={
        selected
          ? {
              backgroundColor: accentColor,
              color: accentForeground,
            }
          : undefined
      }
    >
      {selected ? "Included" : "Add"}
    </Button>
  );
}
