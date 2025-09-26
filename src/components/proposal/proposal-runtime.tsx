"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { PortfolioGrid } from "@/app/proposals/[shareId]/portfolio";
import { logEventAction, updateSelectionsAction } from "@/app/proposals/[shareId]/actions";

import { OptionCard } from "./option-card";
import { ProgressSteps } from "./progress-steps";
import { SummaryTray } from "./summary-tray";
import { ProposalRuntimeProps, RuntimeOption, RuntimeSelection, RuntimeSlide } from "./types";

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
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof json?.error === "string" ? json.error : "Unable to price selections";
        const error = new Error(message) as Error & { violations?: unknown };
        if (json && typeof json === "object" && json !== null && "violations" in json) {
          error.violations = (json as Record<string, unknown>).violations;
        }
        throw error;
      }
      return json as { subtotal: number; tax: number; total: number };
    },
    retry: false
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
  const lastTotalsRef = useRef<{ subtotal: number; tax: number; total: number } | null>(
    props.initialTotals
      ? {
          subtotal: props.initialTotals.subtotal,
          tax: props.initialTotals.tax,
          total: props.initialTotals.total
        }
      : null
  );
  const pendingChangeRef = useRef<{ label: string } | null>(null);
  const [summaryDelta, setSummaryDelta] = useState<{ label: string; amount: number; expiresAt: number } | null>(null);

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

  const pricingQuery = usePricing(proposalId, selections);
  const totals = pricingQuery.data;
  const pricingError = pricingQuery.error instanceof Error ? pricingQuery.error.message : null;

  useEffect(() => {
    if (!totals) {
      return;
    }
    const previousTotals = lastTotalsRef.current;
    lastTotalsRef.current = totals;
    if (!previousTotals) {
      pendingChangeRef.current = null;
      return;
    }
    const changeLabel = pendingChangeRef.current?.label;
    pendingChangeRef.current = null;
    const deltaAmount = totals.total - previousTotals.total;
    if (!changeLabel || Math.abs(deltaAmount) < 0.005) {
      return;
    }
    setSummaryDelta({ label: changeLabel, amount: deltaAmount, expiresAt: Date.now() + 1500 });
  }, [totals]);

  useEffect(() => {
    if (!summaryDelta) {
      return;
    }
    const timeout = setTimeout(() => {
      setSummaryDelta(null);
    }, Math.max(summaryDelta.expiresAt - Date.now(), 0));
    return () => clearTimeout(timeout);
  }, [summaryDelta]);

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
  const progressSteps = useMemo(
    () =>
      slides.map((slide) => ({
        id: slide.id,
        label: slide.title ?? slide.type.replace(/_/g, " ")
      })),
    [slides]
  );

  const registerChange = (option: RuntimeOption, nextQty?: number) => {
    if (typeof nextQty === "number" && nextQty < 0) {
      return;
    }
    const baseLabel = option.catalogItem?.name ?? option.description ?? "Selection";
    const label = typeof nextQty === "number" && nextQty > 1 ? `${baseLabel} ×${nextQty}` : baseLabel;
    pendingChangeRef.current = { label };
  };

  const setChoiceSelection = (slide: RuntimeSlide, option: RuntimeOption) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const o of slide.options.filter((opt) => !opt.isAddOn)) {
        next[o.id] = 0;
      }
      const desiredQty = option.defaultQty ?? 1;
      if (prev[option.id] === desiredQty) {
        return prev;
      }
      registerChange(option, desiredQty);
      next[option.id] = desiredQty;
      return next;
    });
  };

  const toggleAddon = (option: RuntimeOption) => {
    setSelections((prev) => {
      const qty = prev[option.id] ?? 0;
      const nextQty = qty > 0 ? 0 : option.defaultQty ?? 1;
      if (qty === nextQty) {
        return prev;
      }
      registerChange(option, nextQty);
      return { ...prev, [option.id]: nextQty };
    });
  };

  const adjustQuantity = (option: RuntimeOption, delta: number) => {
    setSelections((prev) => {
      const current = prev[option.id] ?? option.defaultQty ?? 0;
      const min = option.minQty ?? 0;
      const max = option.maxQty ?? 5;
      const nextQty = Math.min(Math.max(current + delta, min), max);
      if (nextQty === current) {
        return prev;
      }
      registerChange(option, nextQty);
      return { ...prev, [option.id]: nextQty };
    });
  };

  const clearSelection = (option: RuntimeOption) => {
    setSelections((prev) => {
      if (!(prev[option.id] ?? 0)) {
        return prev;
      }
      registerChange(option, 0);
      const next = { ...prev };
      next[option.id] = 0;
      return next;
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

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Presented by {orgName}</p>
            <h2 className="text-2xl font-semibold">{activeSlide.title ?? "Proposal"}</h2>
            {activeSlide.subtitle ? <p className="text-sm text-muted-foreground">{activeSlide.subtitle}</p> : null}
          </div>
          <span className="text-sm text-muted-foreground">
            Step {activeIndex + 1} of {slides.length}
          </span>
        </div>
        <ProgressSteps steps={progressSteps} currentIndex={activeIndex} />

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
            {activeSlide.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                currency={currency}
                quantity={selections[option.id] ?? 0}
                onSelect={
                  option.isAddOn ? undefined : () => setChoiceSelection(activeSlide, option)
                }
                onToggle={option.isAddOn ? () => toggleAddon(option) : undefined}
                onIncrement={
                  option.isAddOn ? undefined : () => adjustQuantity(option, 1)
                }
                onDecrement={
                  option.isAddOn ? undefined : () => adjustQuantity(option, -1)
                }
              />
            ))}
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
                    <Button variant="ghost" size="sm" onClick={() => clearSelection(option)}>
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
        <SummaryTray
          clientName={clientName}
          clientCompany={clientCompany}
          currency={currency}
          totals={totals ?? null}
          initialTotals={props.initialTotals ?? null}
          isSaving={isPending || acceptMutation.isPending || checkoutMutation.isPending}
          delta={summaryDelta ? { label: summaryDelta.label, amount: summaryDelta.amount } : null}
          errorMessage={pricingError}
        />

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
