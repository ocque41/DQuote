import { z } from "zod";

export const quoteSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  clientName: z.string(),
  status: z.string(),
  shareId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Quote = z.infer<typeof quoteSchema>;
