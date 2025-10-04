import { cache } from "react";

import { prisma } from "@/server/prisma";

export interface QuoteRow {
  id: string;
  orgId: string;
  title: string;
  clientName: string;
  status: string;
  shareId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const listQuotes = cache(async ({
  orgId,
}: {
  orgId: string;
}): Promise<QuoteRow[]> => {
  const proposals = await prisma.proposal.findMany({
    where: {
      orgId,
    },
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return proposals.map((proposal) => ({
    id: proposal.id,
    orgId: proposal.orgId,
    title: proposal.title,
    clientName: proposal.client.name,
    status: proposal.status,
    shareId: proposal.shareId,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  }));
});
