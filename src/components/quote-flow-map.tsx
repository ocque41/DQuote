"use client";

import { Fragment, useMemo } from "react";
import { ArrowRight, GitBranch, GitCommit, MoveRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SlideOption {
  id: string;
  name: string;
  nextSlideId?: string;
}

type QuoteSlideType = "intro" | "addon" | "review";

interface QuoteSlide {
  id: string;
  title: string;
  type: QuoteSlideType;
  position: number;
  options: SlideOption[];
}

interface QuoteFlowMapProps {
  slides: QuoteSlide[];
}

const typeToLabel: Record<QuoteSlideType, { name: string; description: string }> = {
  intro: { name: "Intro", description: "Kickoff messaging" },
  addon: { name: "Add-on", description: "Optional extras" },
  review: { name: "Review", description: "Summary & CTA" },
};

const typeToTone: Record<QuoteSlideType, string> = {
  intro: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900",
  addon: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900",
  review: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900",
};

export function QuoteFlowMap({ slides }: QuoteFlowMapProps) {
  const slideLookup = useMemo(() => {
    return new Map(slides.map((slide) => [slide.id, slide] as const));
  }, [slides]);

  if (slides.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/60 bg-muted/40 p-6 text-center text-muted-foreground">
        <GitCommit className="h-10 w-10" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">No slides yet</p>
          <p className="text-sm">Add slides from the builder to visualize your quote flow.</p>
        </div>
      </div>
    );
  }

  const summary = {
    intro: slides.filter((slide) => slide.type === "intro").length,
    addon: slides.filter((slide) => slide.type === "addon").length,
    review: slides.filter((slide) => slide.type === "review").length,
  } satisfies Record<QuoteSlideType, number>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).map(([type, count]) => {
          const label = type as QuoteSlide["type"];
          return (
            <Card key={label} className="border-dashed bg-muted/30">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">{typeToLabel[label].name}</p>
                  <p className="text-lg font-semibold text-foreground">{count}</p>
                </div>
                <Badge variant="secondary" className={cn("text-xs border", typeToTone[label])}>
                  {typeToLabel[label].description}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ol className="relative space-y-6 border-l border-dashed border-border pl-6">
        {slides.map((slide, index) => {
          const defaultNext = slides[index + 1];
          const optionConnections = slide.options;

          return (
            <li key={slide.id} className="relative">
              <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">
                {index + 1}
              </span>
              <Card className="transition-shadow hover:shadow-sm">
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("border", typeToTone[slide.type])}>
                          {typeToLabel[slide.type].name}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {slide.title || `Slide ${index + 1}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{typeToLabel[slide.type].description}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <GitCommit className="h-3 w-3" />
                      Position {slide.position + 1}
                    </Badge>
                  </div>

                  {optionConnections.length > 0 ? (
                    <div className="space-y-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-sm">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Branching paths</p>
                      <div className="space-y-2">
                        {optionConnections.map((option) => {
                          const target = option.nextSlideId ? slideLookup.get(option.nextSlideId) : defaultNext;
                          const label = target ? target.title || typeToLabel[target.type].name : "End of flow";

                          return (
                            <Fragment key={option.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium text-foreground">{option.name || "Option"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {option.nextSlideId
                                      ? `Jumps to ${label}`
                                      : defaultNext
                                      ? `Continues to ${label}`
                                      : "Ends the presentation"}
                                  </span>
                                </div>
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <GitBranch className="h-3 w-3" />
                                  {option.nextSlideId ? "Conditional" : "Sequential"}
                                </Badge>
                              </div>
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ) : defaultNext ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-xs font-medium text-muted-foreground">
                      <MoveRight className="h-4 w-4 text-primary" />
                      Automatically continues to {defaultNext.title || typeToLabel[defaultNext.type].name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-xs font-medium text-muted-foreground">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      Final slide in the flow
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
