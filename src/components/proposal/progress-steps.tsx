import { cn } from "@/lib/utils";

type ProgressStep = {
  id: string;
  label: string;
};

type ProgressStepsProps = {
  steps: ProgressStep[];
  currentIndex: number;
  accentColor?: string;
  accentSurface?: string;
  accentForeground?: string;
};

export function ProgressSteps({ steps, currentIndex, accentColor, accentSurface, accentForeground }: ProgressStepsProps) {
  const progress = steps.length ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
      <ol className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn("flex items-center gap-2 rounded-full border px-3 py-1", index !== currentIndex && "border-transparent")}
            aria-current={index === currentIndex ? "step" : undefined}
            style={
              index === currentIndex
                ? {
                    borderColor: accentColor,
                    backgroundColor: accentSurface,
                    color: accentForeground,
                  }
                : undefined
            }
          >
            <span className="font-medium">{index + 1}.</span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
