import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

type Totals = {
  subtotal: number;
  tax: number;
  total: number;
};

type SummaryDelta = {
  label: string;
  amount: number;
};

type SummaryTrayProps = {
  clientName: string;
  clientCompany?: string | null;
  currency: string;
  totals?: Totals | null;
  initialTotals?: (Totals & { deposit?: number | null }) | null;
  isSaving: boolean;
  delta?: SummaryDelta | null;
  errorMessage?: string | null;
  deposit?: number | null;
  depositPaid?: boolean;
  signatureId?: string | null;
};

export function SummaryTray({
  clientName,
  clientCompany,
  currency,
  totals,
  initialTotals,
  isSaving,
  delta,
  errorMessage,
  deposit,
  depositPaid,
  signatureId
}: SummaryTrayProps) {
  const displayTotals = totals ?? initialTotals ?? { subtotal: 0, tax: 0, total: 0 };
  const depositAmount = deposit ?? initialTotals?.deposit ?? null;
  const deltaDisplay = delta ?? null;
  const statusMessage = errorMessage
    ? errorMessage
    : depositPaid
      ? "Deposit received. We’ll follow up with next steps shortly."
      : signatureId
        ? "Accepted — pay the deposit when you’re ready to secure the date."
        : isSaving
          ? "Saving your selections…"
          : "Selections auto-save and sync for everyone viewing this link.";
  const statusClass = errorMessage ? "text-destructive" : "text-muted-foreground";
  const statusBackground = errorMessage ? "bg-destructive/10 border-destructive/40" : "bg-muted/50";

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          {clientName}
          {clientCompany ? ` · ${clientCompany}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryRow label="Subtotal" value={formatCurrency(displayTotals.subtotal, currency)} />
        <SummaryRow label="Tax" value={formatCurrency(displayTotals.tax, currency)} />
        <SummaryRow label="Total" value={formatCurrency(displayTotals.total, currency)} emphasize />
        {deltaDisplay ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {deltaDisplay.amount >= 0 ? "Added" : "Removed"} {deltaDisplay.label}
            </span>
            <span
              className={cn(
                "font-medium",
                deltaDisplay.amount >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {deltaDisplay.amount >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(deltaDisplay.amount), currency)}
            </span>
          </div>
        ) : null}
        {depositAmount !== null ? (
          <SummaryRow
            label={depositPaid ? "Deposit paid" : "Deposit due"}
            value={formatCurrency(depositAmount, currency)}
            emphasize={depositPaid}
          />
        ) : null}
        <div className={cn("rounded-xl border p-4 text-xs", statusBackground, statusClass)}>
          {statusMessage}
        </div>
      </CardContent>
    </Card>
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
