import { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/server/prisma";

interface ReceiptPageProps {
  params: Promise<{ shareId: string }>;
}

export const metadata: Metadata = {
  title: "Proposal receipt",
};

export default async function ProposalReceiptPage({ params }: ReceiptPageProps) {
  const { shareId } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { shareId },
    include: {
      org: true,
      client: true,
      quote: true,
      selections: {
        include: {
          option: {
            include: { catalogItem: true },
          },
        },
      },
    },
  });

  if (!proposal || !proposal.quote) {
    notFound();
  }

  const currency = proposal.quote.currency;
  const acceptedAt = proposal.quote.acceptedAt?.toISOString() ?? null;

  const selectionDetails = proposal.selections
    .map((selection) => {
      const option = selection.option;
      if (!option) {
        return null;
      }
      const catalogItem = option.catalogItem;
      const unitPrice = option.priceOverride
        ? Number(option.priceOverride)
        : catalogItem
          ? Number(catalogItem.unitPrice)
          : 0;
      return {
        id: option.id,
        name: catalogItem?.name ?? option.description ?? "Option",
        qty: selection.qty,
        unitPrice,
        lineTotal: unitPrice * selection.qty,
        description: catalogItem?.description ?? option.description ?? null,
      };
    })
    .filter((detail): detail is NonNullable<typeof detail> => Boolean(detail))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-12 text-sm text-foreground">
      <header className="space-y-2 border-b pb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Receipt</p>
        <h1 className="text-2xl font-semibold">{proposal.title}</h1>
        <div className="space-y-1 text-muted-foreground">
          <p>
            Presented by <span className="font-medium text-foreground">{proposal.org.name}</span>
          </p>
          <p>
            Prepared for <span className="font-medium text-foreground">{proposal.client.name}</span>
            {proposal.client.company ? ` · ${proposal.client.company}` : ""}
          </p>
          {acceptedAt ? (
            <p>
              Accepted on <span className="font-medium text-foreground">{new Date(acceptedAt).toLocaleString()}</span>
            </p>
          ) : null}
          {proposal.quote.signatureId ? (
            <p>
              Signature ID: <span className="font-medium text-foreground">{proposal.quote.signatureId}</span>
            </p>
          ) : null}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Totals</h2>
        <div className="space-y-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(Number(proposal.quote.subtotal), currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium">{formatCurrency(Number(proposal.quote.discount), currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">{formatCurrency(Number(proposal.quote.tax), currency)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(Number(proposal.quote.total), currency)}</span>
          </div>
          {proposal.quote.deposit ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-medium">{formatCurrency(Number(proposal.quote.deposit), currency)}</span>
            </div>
          ) : null}
          {proposal.quote.depositPaidAt ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deposit paid</span>
              <span className="font-medium">
                {new Date(proposal.quote.depositPaidAt).toLocaleString()}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Selections</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Unit price</th>
                <th className="px-4 py-3 text-left font-medium">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-background">
              {selectionDetails.length ? (
                selectionDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{detail.name}</p>
                      {detail.description ? (
                        <p className="text-xs text-muted-foreground">{detail.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">{detail.qty}</td>
                    <td className="px-4 py-3 align-top">{formatCurrency(detail.unitPrice, currency)}</td>
                    <td className="px-4 py-3 align-top font-semibold">
                      {formatCurrency(detail.lineTotal, currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                    No selections recorded for this proposal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Acceptance details</h2>
        <div className="space-y-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Accepted by</span>
            <span className="font-medium">{proposal.quote.acceptedByName ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{proposal.quote.acceptedByEmail ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">IP address</span>
            <span className="font-medium">{proposal.quote.acceptedIp ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User agent</span>
            <span className="max-w-xs text-right text-xs text-muted-foreground">
              {proposal.quote.acceptedUserAgent ?? "—"}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
