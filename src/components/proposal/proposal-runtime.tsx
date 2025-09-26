"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EventType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { PortfolioGrid } from "@/app/proposals/[shareId]/portfolio";
import { logEventAction, updateSelectionsAction } from "@/app/proposals/[shareId]/actions";

import { OptionCard } from "./option-card";
import { PortfolioPanel } from "./portfolio-panel";
import { ProgressSteps } from "./progress-steps";
import { SummaryTray } from "./summary-tray";
import { PortfolioAsset, ProposalRuntimeProps, RuntimeOption, RuntimeSelection, RuntimeSlide } from "./types";
import { buildThemeTokens } from "./theme";

const ACCEPTANCE_SCHEMA = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email")
});

type AcceptanceFormValues = z.infer<typeof ACCEPTANCE_SCHEMA>;

const DEFAULT_DEPOSIT_RATE = 0.2;

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
      return json as { subtotal: number; discount: number; tax: number; total: number };
    },
    retry: false
  });
}

export function ProposalRuntime(props: ProposalRuntimeProps) {
  const { proposalId, shareId, slides, assets, orgName, clientName, clientCompany, currency } = props;
  const themeTokens = useMemo(() => buildThemeTokens(props.theme ?? null), [props.theme]);
  const themeStyle = useMemo<CSSProperties>(
    () => ({
      "--proposal-brand": themeTokens.brandColor,
      "--proposal-brand-surface": themeTokens.brandSurface,
      "--proposal-brand-foreground": themeTokens.brandForeground,
      "--proposal-accent": themeTokens.accentColor,
      "--proposal-accent-surface": themeTokens.accentSurface,
      "--proposal-accent-foreground": themeTokens.accentForeground,
    }),
    [themeTokens]
  );

  const defaultSelections = useMemo(() => ({
    ...calculateDefaultSelections(slides),
    ...selectionArrayToMap(props.selections)
  }), [slides, props.selections]);

  const [selections, setSelections] = useState<Record<string, number>>(defaultSelections);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [, startLogTransition] = useTransition();
  const viewerIdRef = useRef<string>();
  if (!viewerIdRef.current) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      viewerIdRef.current = crypto.randomUUID();
    } else {
      viewerIdRef.current = `viewer-${Math.random().toString(36).slice(2)}`;
    }
  }
  const lastTotalsRef = useRef<{ subtotal: number; discount: number; tax: number; total: number } | null>(
    props.initialTotals
      ? {
          subtotal: props.initialTotals.subtotal,
          discount: props.initialTotals.discount ?? 0,
          tax: props.initialTotals.tax,
          total: props.initialTotals.total
        }
      : null
  );
  const pendingChangeRef = useRef<{ label: string } | null>(null);
  const [summaryDelta, setSummaryDelta] = useState<{ label: string; amount: number; expiresAt: number } | null>(null);
  const loggedPortfolioSlidesRef = useRef<Set<string>>(new Set());
  const acceptanceForm = useForm<AcceptanceFormValues>({
    resolver: zodResolver(ACCEPTANCE_SCHEMA),
    mode: "onChange",
    defaultValues: {
      name: props.quoteStatus?.acceptedByName ?? "",
      email: props.quoteStatus?.acceptedByEmail ?? ""
    }
  });
  const [quoteState, setQuoteState] = useState({
    deposit: props.initialTotals?.deposit ?? null,
    depositPaidAt: props.quoteStatus?.depositPaidAt ?? null,
    signatureId: props.quoteStatus?.signatureId ?? null,
    pdfUrl: props.quoteStatus?.pdfUrl ?? null
  });
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const isAccepted = Boolean(quoteState.signatureId);
  const depositPaid = Boolean(quoteState.depositPaidAt);
  const receiptUrl = quoteState.pdfUrl ?? null;

  const optionMeta = useMemo(() => {
    const map = new Map<string, { slideId: string; slideType: string; slideTitle?: string | null }>();
    for (const slide of slides) {
      for (const option of slide.options) {
        map.set(option.id, { slideId: slide.id, slideType: slide.type, slideTitle: slide.title });
      }
    }
    return map;
  }, [slides]);

  const logRuntimeEvent = useCallback(
    (type: EventType, data?: Record<string, unknown>) => {
      const viewerId = viewerIdRef.current;
      startLogTransition(() =>
        logEventAction({
          shareId,
          type,
          data: {
            viewerId,
            ...data
          }
        })
      );
    },
    [shareId, startLogTransition]
  );

  useEffect(() => {
    startTransition(() => updateSelectionsAction({ shareId, selections: selectionsToArray(selections) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) {
      return;
    }
    logRuntimeEvent(EventType.VIEW, {
      slideIndex: activeIndex,
      slideId: activeSlide.id,
      slideType: activeSlide.type,
      slideTitle: activeSlide.title
    });

    if (activeSlide.type === "PORTFOLIO" && !loggedPortfolioSlidesRef.current.has(activeSlide.id)) {
      loggedPortfolioSlidesRef.current.add(activeSlide.id);
      logRuntimeEvent(EventType.PORTFOLIO_OPEN, {
        slideIndex: activeIndex,
        slideId: activeSlide.id,
        slideTitle: activeSlide.title
      });
    }
  }, [activeIndex, logRuntimeEvent, slides]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => updateSelectionsAction({ shareId, selections: selectionsToArray(selections) }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [selections, shareId, startTransition]);

  const pricingQuery = usePricing(proposalId, selections);
  const totals = pricingQuery.data;
  const pricingError = pricingQuery.error instanceof Error ? pricingQuery.error.message : null;
  const isPricingLoading = (pricingQuery as { isPending?: boolean }).isPending
    ? Boolean(pricingQuery.isPending && !pricingQuery.data)
    : pricingQuery.fetchStatus === "fetching" && !pricingQuery.data;

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

  const matchingAssets = useMemo<PortfolioAsset[]>(() => {
    if (!assets.length) return [];
    if (!selectionTags.length) {
      return assets;
    }
    const matches = assets.filter((asset) => asset.tags?.some((tag) => selectionTags.includes(tag)));
    return matches.length ? matches : assets;
  }, [assets, selectionTags]);

  const curatedAssets = useMemo<PortfolioAsset[]>(() => {
    if (!assets.length) return [];
    const baseMatches = selectionTags.length
      ? assets.filter((asset) => asset.tags?.some((tag) => selectionTags.includes(tag)))
      : [...assets];
    const base = baseMatches.length ? baseMatches : assets;
    if (base.length >= 4) {
      return base.slice(0, 4);
    }
    if (base.length >= 2) {
      return base;
    }
    const filler = assets.filter((asset) => !base.some((item) => item.id === asset.id));
    return [...base, ...filler].slice(0, Math.min(4, assets.length));
  }, [assets, selectionTags]);
  const selectedOptionDetails = useMemo(() => {
    return slides
      .flatMap((slide) => slide.options)
      .filter((option) => (selections[option.id] ?? 0) > 0)
      .map((option) => {
        const qty = selections[option.id] ?? 0;
        const unitPrice = Number(option.priceOverride ?? option.catalogItem?.unitPrice ?? 0);
        return {
          option,
          qty,
          unitPrice,
          lineTotal: unitPrice * qty
        };
      });
  }, [slides, selections]);
  const currentTotals = totals ?? props.initialTotals ?? { subtotal: 0, discount: 0, tax: 0, total: 0 };
  const estimatedDeposit = quoteState.deposit ??
    (currentTotals.total ? Math.round(currentTotals.total * DEFAULT_DEPOSIT_RATE * 100) / 100 : null);
  const depositDisplay = quoteState.deposit ?? estimatedDeposit;

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
  const acceptSlideIndex = slides.findIndex((slide) => slide.type === "ACCEPT");
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

  const emitSelectionEvent = (type: EventType.SELECT | EventType.DESELECT, option: RuntimeOption, qty: number) => {
    const meta = optionMeta.get(option.id);
    logRuntimeEvent(type, {
      optionId: option.id,
      optionLabel: option.catalogItem?.name ?? option.description,
      quantity: qty,
      slideId: meta?.slideId,
      slideType: meta?.slideType,
      slideTitle: meta?.slideTitle
    });
  };

  const setChoiceSelection = (slide: RuntimeSlide, option: RuntimeOption) => {
    const eventsToLog: Array<{ type: EventType.SELECT | EventType.DESELECT; option: RuntimeOption; qty: number }> = [];
    setSelections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const o of slide.options.filter((opt) => !opt.isAddOn && opt.id !== option.id)) {
        if ((prev[o.id] ?? 0) > 0) {
          next[o.id] = 0;
          changed = true;
          eventsToLog.push({ type: EventType.DESELECT, option: o, qty: 0 });
        }
      }
      const desiredQty = option.defaultQty ?? 1;
      if (prev[option.id] !== desiredQty) {
        registerChange(option, desiredQty);
        next[option.id] = desiredQty;
        changed = true;
        eventsToLog.push({ type: EventType.SELECT, option, qty: desiredQty });
      }
      if (!changed) {
        eventsToLog.length = 0;
        return prev;
      }
      return next;
    });
    for (const event of eventsToLog) {
      emitSelectionEvent(event.type, event.option, event.qty);
    }
  };

  const toggleAddon = (option: RuntimeOption) => {
    const eventsToLog: Array<{ type: EventType.SELECT | EventType.DESELECT; option: RuntimeOption; qty: number }> = [];
    setSelections((prev) => {
      const qty = prev[option.id] ?? 0;
      const nextQty = qty > 0 ? 0 : option.defaultQty ?? 1;
      if (qty === nextQty) {
        eventsToLog.length = 0;
        return prev;
      }
      registerChange(option, nextQty);
      eventsToLog.push({ type: nextQty > 0 ? EventType.SELECT : EventType.DESELECT, option, qty: nextQty });
      return { ...prev, [option.id]: nextQty };
    });
    for (const event of eventsToLog) {
      emitSelectionEvent(event.type, event.option, event.qty);
    }
  };

  const adjustQuantity = (option: RuntimeOption, delta: number) => {
    const eventsToLog: Array<{ type: EventType.SELECT | EventType.DESELECT; option: RuntimeOption; qty: number }> = [];
    setSelections((prev) => {
      const current = prev[option.id] ?? option.defaultQty ?? 0;
      const min = option.minQty ?? 0;
      const max = option.maxQty ?? 5;
      const nextQty = Math.min(Math.max(current + delta, min), max);
      if (nextQty === current) {
        eventsToLog.length = 0;
        return prev;
      }
      registerChange(option, nextQty);
      eventsToLog.push({ type: nextQty > 0 ? EventType.SELECT : EventType.DESELECT, option, qty: nextQty });
      return { ...prev, [option.id]: nextQty };
    });
    for (const event of eventsToLog) {
      emitSelectionEvent(event.type, event.option, event.qty);
    }
  };

  const clearSelection = (option: RuntimeOption) => {
    const eventsToLog: Array<{ type: EventType.SELECT | EventType.DESELECT; option: RuntimeOption; qty: number }> = [];
    setSelections((prev) => {
      if (!(prev[option.id] ?? 0)) {
        eventsToLog.length = 0;
        return prev;
      }
      registerChange(option, 0);
      const next = { ...prev };
      next[option.id] = 0;
      eventsToLog.push({ type: EventType.DESELECT, option, qty: 0 });
      return next;
    });
    for (const event of eventsToLog) {
      emitSelectionEvent(event.type, event.option, event.qty);
    }
  };

  const acceptMutation = useMutation<
    { deposit?: number | null; signatureId?: string | null; pdfUrl?: string | null },
    Error,
    AcceptanceFormValues
  >({
    mutationFn: async (values) => {
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, name: values.name, email: values.email })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        let message = "Failed to accept proposal";
        const errorPayload = json as {
          error?:
            | string
            | {
                formErrors?: string[];
                fieldErrors?: Record<string, string[]>;
              };
        } | null;
        if (errorPayload?.error) {
          if (typeof errorPayload.error === "string") {
            message = errorPayload.error;
          } else {
            const fieldErrors = errorPayload.error.fieldErrors ?? {};
            const firstFieldError = Object.values(fieldErrors).flat()[0];
            message = firstFieldError ?? errorPayload.error.formErrors?.[0] ?? message;
          }
        }
        throw new Error(message);
      }
      return (json ?? {}) as { deposit?: number | null; signatureId?: string | null; pdfUrl?: string | null };
    },
    onMutate: () => {
      setAcceptError(null);
    },
    onSuccess: (data) => {
      setQuoteState((prev) => ({
        deposit: typeof data.deposit === "number" ? data.deposit : prev.deposit,
        depositPaidAt: prev.depositPaidAt,
        signatureId: data.signatureId ?? prev.signatureId ?? null,
        pdfUrl: data.pdfUrl ?? prev.pdfUrl
      }));
      if (acceptSlideIndex >= 0) {
        setActiveIndex(acceptSlideIndex);
      }
    },
    onError: (error) => {
      setAcceptError(error.message);
    }
  });

  const checkoutMutation = useMutation<{ url?: string }, Error, void>({
    mutationFn: async () => {
      if (!isAccepted) {
        throw new Error("Accept the proposal before paying the deposit.");
      }
      if (quoteState.deposit === null || quoteState.deposit <= 0) {
        throw new Error("Deposit amount is not available yet.");
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          (json && typeof json === "object" && json !== null && "error" in json && typeof json.error === "string")
            ? json.error
            : "Unable to create checkout session";
        throw new Error(message);
      }
      const payload = (json ?? {}) as { url?: string };
      if (payload.url) {
        window.location.href = payload.url;
      }
      return payload;
    },
    onMutate: () => {
      setCheckoutError(null);
    },
    onError: (error) => {
      setCheckoutError(error.message);
    }
  });

  const handleAccept = acceptanceForm.handleSubmit((values) => acceptMutation.mutate(values));
  const acceptanceValues = acceptanceForm.watch();

  const goNext = () => setActiveIndex((index) => Math.min(index + 1, slides.length - 1));
  const goPrevious = () => setActiveIndex((index) => Math.max(index - 1, 0));

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]" style={themeStyle}>
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
        <ProgressSteps
          steps={progressSteps}
          currentIndex={activeIndex}
          accentColor={themeTokens.accentColor}
          accentSurface={themeTokens.accentSurface}
          accentForeground={themeTokens.accentForeground}
        />

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

        {pricingError ? (
          <div
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {pricingError}
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
                theme={{
                  brandColor: themeTokens.brandColor,
                  brandSurface: themeTokens.brandSurface,
                  brandForeground: themeTokens.brandForeground,
                  accentColor: themeTokens.accentColor,
                  accentForeground: themeTokens.accentForeground,
                }}
              />
            ))}
          </div>
        ) : null}

        {activeSlide.type === "PORTFOLIO" ? <PortfolioGrid assets={matchingAssets} /> : null}

        {activeSlide.type !== "PORTFOLIO" ? (
          <PortfolioPanel assets={curatedAssets} activeTags={selectionTags} />
        ) : null}

        {activeSlide.type === "REVIEW" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Selections</h3>
              <div className="space-y-3">
                {selectedOptionDetails.length ? (
                  selectedOptionDetails.map((detail) => (
                    <div
                      key={detail.option.id}
                      className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{detail.option.catalogItem?.name ?? detail.option.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {detail.qty} · {formatCurrency(detail.unitPrice, currency)} each
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-sm font-semibold">
                          {formatCurrency(detail.lineTotal, currency)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => clearSelection(detail.option)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                    Choose at least one option to generate a proposal summary.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <h4 className="text-base font-semibold">Itemized totals</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(currentTotals.subtotal, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(currentTotals.tax, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(currentTotals.total, currency)}</span>
                </div>
                {estimatedDeposit !== null ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated deposit (20%)</span>
                    <span>{formatCurrency(estimatedDeposit, currency)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <Form {...acceptanceForm}>
              <form className="space-y-4" noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={acceptanceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accepting on behalf of</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={acceptanceForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            inputMode="email"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We’ll send confirmations and the PDF receipt to this address after payment.
                </p>
              </form>
            </Form>
          </div>
        ) : null}

        {activeSlide.type === "ACCEPT" ? (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Ready to move forward?</h3>
            <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Confirm the details captured on the review step and submit to generate a signature record.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Acceptor</span>
                <span className="font-medium">
                  {acceptanceValues.name || props.quoteStatus?.acceptedByName || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">
                  {acceptanceValues.email || props.quoteStatus?.acceptedByEmail || "—"}
                </span>
              </div>
              {depositDisplay !== null ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="flex items-center gap-2 font-medium">
                    {depositPaid ? <Badge variant="outline">Paid</Badge> : null}
                    {formatCurrency(depositDisplay, currency)}
                  </span>
                </div>
              ) : null}
            </div>
            {acceptError ? <p className="text-sm text-destructive">{acceptError}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                onClick={handleAccept}
                disabled={acceptMutation.isPending || isAccepted}
              >
                {acceptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isAccepted ? "Accepted" : "Accept proposal"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => checkoutMutation.mutate()}
                disabled={
                  checkoutMutation.isPending ||
                  quoteState.deposit === null ||
                  quoteState.deposit <= 0 ||
                  !isAccepted ||
                  depositPaid
                }
              >
                {checkoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {depositPaid ? "Deposit complete" : "Pay deposit via Stripe"}
              </Button>
              {receiptUrl ? (
                <Button asChild className="w-full sm:w-auto" variant="secondary">
                  <a href={receiptUrl} target="_blank" rel="noreferrer" download>
                    Download PDF receipt
                  </a>
                </Button>
              ) : null}
            </div>
            {checkoutError ? <p className="text-sm text-destructive">{checkoutError}</p> : null}
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
          isLoading={isPricingLoading}
          delta={summaryDelta ? { label: summaryDelta.label, amount: summaryDelta.amount } : null}
          errorMessage={pricingError}
          deposit={quoteState.deposit}
          depositPaid={depositPaid}
          signatureId={quoteState.signatureId}
        />

        {activeSlide.type !== "PORTFOLIO" ? (
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio preview</CardTitle>
                <CardDescription>Matched to selected tags: {selectionTags.length ? selectionTags.join(", ") : "All"}</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioGrid assets={curatedAssets.slice(0, 2)} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
