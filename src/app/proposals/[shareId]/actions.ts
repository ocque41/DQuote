"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { EventType, Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma";

const SelectionSchema = z.object({
  optionId: z.string().uuid(),
  qty: z.number().int().min(0)
});

const UpdateSelectionsSchema = z.object({
  shareId: z.string(),
  selections: z.array(SelectionSchema)
});

const EventSchema = z.object({
  shareId: z.string(),
  type: z.nativeEnum(EventType),
  data: z.record(z.string(), z.any()).optional()
});

export async function updateSelectionsAction(input: z.infer<typeof UpdateSelectionsSchema>) {
  const parsed = UpdateSelectionsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { shareId: parsed.data.shareId },
    select: { id: true }
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  await prisma.$transaction([
    prisma.selection.deleteMany({ where: { proposalId: proposal.id } }),
    prisma.selection.createMany({
      data: parsed.data.selections
        .filter((selection) => selection.qty > 0)
        .map((selection) => ({
          proposalId: proposal.id,
          optionId: selection.optionId,
          qty: selection.qty
        }))
    })
  ]);

  revalidatePath(`/proposals/${parsed.data.shareId}`);
}

export async function logEventAction(input: z.infer<typeof EventSchema>) {
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { shareId: parsed.data.shareId },
    select: { id: true }
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  await prisma.event.create({
    data: {
      proposalId: proposal.id,
      type: parsed.data.type,
      data: parsed.data.data ? (parsed.data.data as Prisma.InputJsonValue) : Prisma.JsonNull
    }
  });
}
