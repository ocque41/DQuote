import { Button } from "@/components/ui/button";

type AddOnToggleProps = {
  selected: boolean;
  onToggle: () => void;
};

export function AddOnToggle({ selected, onToggle }: AddOnToggleProps) {
  return (
    <Button variant={selected ? "default" : "outline"} className="w-full" onClick={onToggle}>
      {selected ? "Included" : "Add"}
    </Button>
  );
}
