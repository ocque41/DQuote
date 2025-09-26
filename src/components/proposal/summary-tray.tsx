import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

type Totals = {
  subtotal: number;
  tax: number;
  total: number;
};

type SummaryTrayProps = {
  clientName: string;
  clientCompany?: string | null;
  currency: string;
  totals?: Totals | null;
  initialTotals?: (Totals & { deposit?: number | null }) | null;
  isSaving: boolean;
};

export function SummaryTray({ clientName, clientCompany, currency, totals, initialTotals, isSaving }: SummaryTrayProps) {
  const displayTotals = totals ?? initialTotals ?? { subtotal: 0, tax: 0, total: 0 };
  const deposit = initialTotals?.deposit ?? null;

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
        {deposit ? <SummaryRow label="Deposit" value={formatCurrency(deposit, currency)} /> : null}
        <div className="rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground">
          {isSaving ? "Saving your selections…" : "Selections auto-save and sync for everyone viewing this link."}
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
