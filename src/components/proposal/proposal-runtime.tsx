"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { PortfolioAsset, PortfolioGrid } from "@/app/(app)/proposals/[shareId]/portfolio";
import { logEventAction, updateSelectionsAction } from "@/app/(app)/proposals/[shareId]/actions";

export type RuntimeSlide = {
  id: string;
  type: "INTRO" | "CHOICE_CORE" | "ADDONS" | "PORTFOLIO" | "REVIEW" | "ACCEPT";
  title?: string | null;
  subtitle?: string | null;
  position: number;
  meta?: Record<string, unknown> | null;
  options: RuntimeOption[];
};

export type RuntimeOption = {
  id: string;
  kind: "ITEM" | "BUNDLE";
  description?: string | null;
  priceOverride?: number | null;
  isDefault: boolean;
  isAddOn: boolean;
  minQty?: number | null;
  maxQty?: number | null;
  defaultQty?: number | null;
  catalogItem?: {
    id: string;
    name: string;
    description?: string | null;
    unitPrice: number;
    currency: string;
    tags: string[];
  } | null;
};

export type RuntimeSelection = {
  optionId: string;
  qty: number;
};

export type ProposalRuntimeProps = {
  proposalId: string;
  shareId: string;
  currency: string;
  orgName: string;
  clientName: string;
  clientCompany?: string | null;
  slides: RuntimeSlide[];
  selections: RuntimeSelection[];
  assets: PortfolioAsset[];
  initialTotals?: {
    subtotal: number;
    tax: number;
    total: number;
    deposit?: number | null;
  } | null;
  theme?: Record<string, unknown> | null;
};

function calculateDefaultSelections(slides: RuntimeSlide[]): Record<string, number> {
  const next: Record<string, number> = {};
  for (const slide of slides) {
    for (const option of slide.options) {
      if (option.isDefault) {
        next[option.id] = option.defaultQty ?? 1;
      }
    }
  }
  return next;
}

function selectionArrayToMap(selections: RuntimeSelection[]): Record<string, number> {
  return selections.reduce<Record<string, number>>((acc, selection) => {
    acc[selection.optionId] = selection.qty;
    return acc;
  }, {});
}

function selectionsToArray(map: Record<string, number>): RuntimeSelection[] {
  return Object.entries(map).map(([optionId, qty]) => ({ optionId, qty }));
}

function usePricing(proposalId: string, selectionMap: Record<string, number>) {
  const payload = useMemo(
    () =>
      Object.entries(selectionMap)
        .filter(([, qty]) => qty > 0)
        .map(([optionId, qty]) => ({ optionId, qty })),
    [selectionMap]
  );

  return useQuery({
    queryKey: ["pricing", proposalId, payload],
    queryFn: async () => {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, selections: payload })
      });
      if (!res.ok) {
        throw new Error("Unable to price selections");
      }
      return (await res.json()) as { subtotal: number; tax: number; total: number };
    }
  });
}

export function ProposalRuntime(props: ProposalRuntimeProps) {
  const { proposalId, shareId, slides, assets, orgName, clientName, clientCompany, currency } = props;

  const defaultSelections = useMemo(() => ({
    ...calculateDefaultSelections(slides),
    ...selectionArrayToMap(props.selections)
  }), [slides, props.selections]);

  const [selections, setSelections] = useState<Record<string, number>>(defaultSelections);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [, startLogTransition] = useTransition();

  useEffect(() => {
    startTransition(() => updateSelectionsAction({ shareId, selections: selectionsToArray(selections) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    startLogTransition(() => logEventAction({ shareId, type: "VIEW", data: { slide: activeIndex + 1 } }));
  }, [activeIndex, shareId, startLogTransition]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => updateSelectionsAction({ shareId, selections: selectionsToArray(selections) }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [selections, shareId, startTransition]);

  const { data: totals } = usePricing(proposalId, selections);

  const selectionTags = useMemo(() => {
    const tags = new Set<string>();
    for (const slide of slides) {
      for (const option of slide.options) {
        if (selections[option.id] && selections[option.id] > 0) {
          option.catalogItem?.tags.forEach((tag) => tags.add(tag));
        }
      }
    }
    return Array.from(tags);
  }, [slides, selections]);

  const filteredAssets = useMemo(() => {
    if (!selectionTags.length) return assets;
    return assets.filter((asset) => asset.tags?.some((tag) => selectionTags.includes(tag)));
  }, [assets, selectionTags]);

  const activeSlide = slides[activeIndex];
  const introMeta =
    activeSlide?.type === "INTRO"
      ? (activeSlide.meta as { headline?: unknown; agenda?: unknown } | null)
      : null;
  const introHeadline = typeof introMeta?.headline === "string" ? introMeta.headline : undefined;
  const introAgenda = Array.isArray(introMeta?.agenda)
    ? (introMeta.agenda as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const isChoiceSlide = activeSlide?.type === "CHOICE_CORE" || activeSlide?.type === "ADDONS";

  const setChoiceSelection = (slide: RuntimeSlide, option: RuntimeOption) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const o of slide.options.filter((opt) => !opt.isAddOn)) {
        next[o.id] = 0;
      }
      next[option.id] = option.defaultQty ?? 1;
      return next;
    });
  };

  const toggleAddon = (option: RuntimeOption) => {
    setSelections((prev) => {
      const qty = prev[option.id] ?? 0;
      const nextQty = qty > 0 ? 0 : option.defaultQty ?? 1;
      return { ...prev, [option.id]: nextQty };
    });
  };

  const adjustQuantity = (option: RuntimeOption, delta: number) => {
    setSelections((prev) => {
      const current = prev[option.id] ?? option.defaultQty ?? 0;
      const min = option.minQty ?? 0;
      const max = option.maxQty ?? 5;
      const nextQty = Math.min(Math.max(current + delta, min), max);
      return { ...prev, [option.id]: nextQty };
    });
  };

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId })
      });
      if (!res.ok) {
        throw new Error("Failed to accept proposal");
      }
      await logEventAction({ shareId, type: "ACCEPT" });
      return (await res.json()) as { ok: boolean };
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: Object.entries(selections)
            .filter(([, qty]) => qty > 0)
            .map(([optionId, qty]) => {
              const option = slides.flatMap((s) => s.options).find((o) => o.id === optionId);
              const base = option?.priceOverride ?? option?.catalogItem?.unitPrice ?? 0;
              return {
                quantity: qty,
                price_data: {
                  currency,
                  product_data: {
                    name: option?.catalogItem?.name ?? option?.description ?? "Custom option"
                  },
                  unit_amount: Math.round((Number(base) || 0) * 100)
                }
              };
            })
        })
      });
      if (!res.ok) {
        throw new Error("Unable to create checkout session");
      }
      const json = (await res.json()) as { url?: string };
      if (json.url) {
        window.location.href = json.url;
      }
      await logEventAction({ shareId, type: "PAY" });
      return json;
    }
  });

  const goNext = () => setActiveIndex((index) => Math.min(index + 1, slides.length - 1));
  const goPrevious = () => setActiveIndex((index) => Math.max(index - 1, 0));

  const progress = ((activeIndex + 1) / slides.length) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Presented by {orgName}</p>
            <h2 className="text-2xl font-semibold">{activeSlide.title ?? "Proposal"}</h2>
            {activeSlide.subtitle ? <p className="text-sm text-muted-foreground">{activeSlide.subtitle}</p> : null}
          </div>
          <span className="text-sm text-muted-foreground">
            Step {activeIndex + 1} of {slides.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        {activeSlide.type === "INTRO" ? (
          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            {introHeadline ? <p className="text-lg font-semibold">{introHeadline}</p> : null}
            <p className="text-sm text-muted-foreground">
              Crafted for {clientName}
              {clientCompany ? ` · ${clientCompany}` : ""} by {orgName}.
            </p>
            {introAgenda.length ? (
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {introAgenda.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {isChoiceSlide ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSlide.options.map((option) => {
              const optionPrice = option.priceOverride ?? option.catalogItem?.unitPrice ?? 0;
              const isSelected = (selections[option.id] ?? 0) > 0;
              const isAddon = option.isAddOn;
              return (
                <Card
                  key={option.id}
                  className={cn(
                    "relative flex flex-col justify-between border-2 transition",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <CardHeader>
                    <CardTitle>{option.catalogItem?.name ?? option.description ?? "Custom option"}</CardTitle>
                    <CardDescription>{option.catalogItem?.description ?? option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg font-semibold">{formatCurrency(Number(optionPrice), currency)}</p>
                    {isAddon ? (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className="w-full"
                        onClick={() => toggleAddon(option)}
                      >
                        {isSelected ? "Included" : "Add"}
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => setChoiceSelection(activeSlide, option)}>
                        {isSelected ? "Selected" : "Choose"}
                      </Button>
                    )}
                    {!isAddon && (
                      <div className="flex items-center justify-between rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {option.catalogItem?.tags?.slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    )}
                    {isSelected && !isAddon && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Quantity</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => adjustQuantity(option, -1)}
                          >
                            -
                          </Button>
                          <span>{selections[option.id]}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => adjustQuantity(option, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  {option.isDefault ? (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      <Check className="h-3 w-3" /> Recommended
                    </span>
                  ) : null}
                </Card>
              );
            })}
          </div>
        ) : null}

        {activeSlide.type === "PORTFOLIO" ? (
          <PortfolioGrid assets={filteredAssets} />
        ) : null}

        {activeSlide.type === "REVIEW" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selections</h3>
            <div className="space-y-3">
              {slides
                .flatMap((slide) => slide.options)
                .filter((option) => (selections[option.id] ?? 0) > 0)
                .map((option) => (
                  <div key={option.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium">{option.catalogItem?.name ?? option.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {selections[option.id]} · {formatCurrency(Number(option.priceOverride ?? option.catalogItem?.unitPrice ?? 0), currency)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelections((prev) => ({ ...prev, [option.id]: 0 }))}>
                      Remove
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {activeSlide.type === "ACCEPT" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ready to move forward?</h3>
            <p className="text-muted-foreground">
              Accept to lock pricing. You can optionally pay the deposit now and book a kickoff call.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                {acceptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept proposal
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pay deposit via Stripe
              </Button>
            </div>
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <a href="https://cal.com" target="_blank" rel="noreferrer">
                Schedule kickoff demo
              </a>
            </Button>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-6">
          <Button variant="ghost" onClick={goPrevious} disabled={activeIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={goNext} disabled={activeIndex === slides.length - 1}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <aside className="space-y-4">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {clientName}
              {clientCompany ? ` · ${clientCompany}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Subtotal" value={formatCurrency(totals?.subtotal ?? props.initialTotals?.subtotal ?? 0, currency)} />
            <SummaryRow label="Tax" value={formatCurrency(totals?.tax ?? props.initialTotals?.tax ?? 0, currency)} />
            <SummaryRow label="Total" value={formatCurrency(totals?.total ?? props.initialTotals?.total ?? 0, currency)} emphasize />
            {props.initialTotals?.deposit ? (
              <SummaryRow label="Deposit" value={formatCurrency(Number(props.initialTotals.deposit), currency)} />
            ) : null}
            <div className="rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground">
              {isPending ? "Saving your selections…" : "Selections auto-save and sync for everyone viewing this link."}
            </div>
          </CardContent>
        </Card>

        {activeSlide.type !== "PORTFOLIO" ? (
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio preview</CardTitle>
                <CardDescription>Matched to selected tags: {selectionTags.length ? selectionTags.join(", ") : "All"}</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioGrid assets={filteredAssets.slice(0, 2)} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", emphasize && "font-medium text-foreground")}>{label}</span>
      <span className={cn(emphasize && "text-lg font-semibold")}>{value}</span>
    </div>
  );
}
