import { cache } from "react";

import { Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma";

export interface QuoteRow {
  id: string;
  orgId: string;
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  last: number;
  changePct: number;
  updatedAt: Date;
  pinned?: boolean;
}

const demoQuotes: QuoteRow[] = [
  {
    id: "demo-1",
    orgId: "demo",
    symbol: "DQT",
    name: "DQuote Holdings",
    bid: 121.32,
    ask: 122.08,
    last: 121.84,
    changePct: 3.24,
    updatedAt: new Date("2024-06-30T15:30:00Z"),
    pinned: true,
  },
  {
    id: "demo-2",
    orgId: "demo",
    symbol: "STACK",
    name: "Stackframe Cloud",
    bid: 54.28,
    ask: 54.81,
    last: 54.6,
    changePct: 1.12,
    updatedAt: new Date("2024-06-30T15:25:00Z"),
  },
  {
    id: "demo-3",
    orgId: "demo",
    symbol: "NEON",
    name: "Neon Infrastructure",
    bid: 88.96,
    ask: 89.51,
    last: 89.22,
    changePct: -2.18,
    updatedAt: new Date("2024-06-30T15:18:00Z"),
  },
  {
    id: "demo-4",
    orgId: "demo",
    symbol: "QLYT",
    name: "Qualify AI",
    bid: 64.67,
    ask: 65.12,
    last: 64.88,
    changePct: 4.76,
    updatedAt: new Date("2024-06-30T15:10:00Z"),
  },
  {
    id: "demo-5",
    orgId: "demo",
    symbol: "CAL",
    name: "Cal Schedulers",
    bid: 33.5,
    ask: 33.93,
    last: 33.71,
    changePct: -1.42,
    updatedAt: new Date("2024-06-30T14:50:00Z"),
  },
  {
    id: "demo-6",
    orgId: "demo",
    symbol: "VERC",
    name: "Vercel Deployments",
    bid: 112.3,
    ask: 112.76,
    last: 112.54,
    changePct: 0.64,
    updatedAt: new Date("2024-06-30T14:35:00Z"),
  },
];

export const listQuotes = cache(async ({
  orgId,
}: {
  orgId: string;
}): Promise<QuoteRow[]> => {
  // TODO: Replace with Neon query once quotes tables are available and scoped by org_id.
  try {
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      org_id: string;
      symbol: string;
      name: string;
      bid: number;
      ask: number;
      last: number;
      change_pct: number;
      updated_at: Date;
      pinned: boolean | null;
    }>>(Prisma.sql`SELECT * FROM quotes_demo WHERE org_id = ${orgId} ORDER BY updated_at DESC`);

    if (rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        orgId: row.org_id,
        symbol: row.symbol,
        name: row.name,
        bid: Number(row.bid),
        ask: Number(row.ask),
        last: Number(row.last),
        changePct: Number(row.change_pct),
        updatedAt: row.updated_at,
        pinned: row.pinned ?? false,
      }));
    }
  } catch (error) {
    console.warn("quotes_demo table not found; falling back to seed data", error);
  }

  return demoQuotes
    .filter((quote) => quote.orgId === orgId || quote.orgId === "demo")
    .map((quote) => ({ ...quote, pinned: quote.pinned ?? false }));
});
