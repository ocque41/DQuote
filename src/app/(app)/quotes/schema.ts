import { z } from "zod";

export const quoteSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  bid: z.number(),
  ask: z.number(),
  last: z.number(),
  changePct: z.number(),
  updatedAt: z.coerce.date(),
  pinned: z.boolean().default(false),
});

export type Quote = z.infer<typeof quoteSchema>;
