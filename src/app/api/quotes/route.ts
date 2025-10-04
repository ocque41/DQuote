import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/server/prisma";

const SlideOptionSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string().optional(),
  nextSlideId: z.string().optional(),
  catalogItemId: z.string().uuid().optional(),
});

const SlideSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  type: z.enum(["intro", "choice", "addon", "review"]),
  position: z.number(),
  catalogItemId: z.string().uuid().optional(),
  catalogItemName: z.string().optional(),
  optionA: SlideOptionSchema.optional(),
  optionB: SlideOptionSchema.optional(),
});

const CreateQuoteSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientCompany: z.string().optional(),
  description: z.string().optional(),
  slides: z.array(SlideSchema),
  currency: z.string().default("EUR"),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json();
  const parsed = CreateQuoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid quote data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { clientName, clientEmail, clientCompany, slides, ...quoteData } = parsed.data;

  try {
    // Find existing client by email or create new
    let client;
    if (clientEmail) {
      client = await prisma.client.findFirst({
        where: {
          orgId: authResult.viewer.org.id,
          email: clientEmail,
        },
      });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          orgId: authResult.viewer.org.id,
          name: clientName,
          email: clientEmail,
          company: clientCompany,
        },
      });
    }

    // Generate unique share ID
    const shareId = randomBytes(8).toString("hex");

    // Map slide types to schema enum
    const mapSlideType = (type: string): "INTRO" | "CHOICE_CORE" | "ADDONS" | "REVIEW" => {
      switch (type) {
        case "intro":
          return "INTRO";
        case "choice":
          return "CHOICE_CORE";
        case "addon":
          return "ADDONS";
        case "review":
          return "REVIEW";
        default:
          return "INTRO";
      }
    };

    // Create proposal with slides and options
    const proposal = await prisma.proposal.create({
      data: {
        orgId: authResult.viewer.org.id,
        clientId: client.id,
        title: quoteData.title,
        shareId,
        status: "DRAFT",
        expiresAt: quoteData.expiresAt ? new Date(quoteData.expiresAt) : null,
        createdBy: authResult.viewer.orgUser.id,
        slides: {
          create: slides.map((slide) => {
            const slideData: Prisma.SlideCreateWithoutProposalInput = {
              type: mapSlideType(slide.type),
              title: slide.title,
              subtitle: slide.subtitle,
              position: slide.position,
              catalogItemId: slide.catalogItemId,
              catalogItemName: slide.catalogItemName,
              options: {
                create: [],
              },
            };

            // Add options if they exist
            const options: Prisma.OptionCreateWithoutSlideInput[] = [];

            if (slide.optionA) {
              const optionAData: Prisma.OptionCreateWithoutSlideInput = {
                kind: "ITEM",
                name: slide.optionA.name,
                description: slide.optionA.description,
                priceOverride: new Prisma.Decimal(slide.optionA.price),
                currency: quoteData.currency,
                isDefault: false,
                isAddOn: slide.type === "addon",
                nextSlideId: slide.optionA.nextSlideId,
              };

              if (slide.optionA.catalogItemId) {
                optionAData.catalogItem = {
                  connect: { id: slide.optionA.catalogItemId },
                };
              }

              options.push(optionAData);
            }

            if (slide.optionB && slide.type === "choice") {
              const optionBData: Prisma.OptionCreateWithoutSlideInput = {
                kind: "ITEM",
                name: slide.optionB.name,
                description: slide.optionB.description,
                priceOverride: new Prisma.Decimal(slide.optionB.price),
                currency: quoteData.currency,
                isDefault: false,
                isAddOn: false,
                nextSlideId: slide.optionB.nextSlideId,
              };

              if (slide.optionB.catalogItemId) {
                optionBData.catalogItem = {
                  connect: { id: slide.optionB.catalogItemId },
                };
              }

              options.push(optionBData);
            }

            if (options.length > 0) {
              slideData.options = { create: options };
            }

            return slideData;
          }),
        },
      },
      include: {
        slides: {
          include: {
            options: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        client: true,
      },
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        shareId: proposal.shareId,
        title: proposal.title,
        status: proposal.status,
        client: {
          name: proposal.client.name,
          email: proposal.client.email,
        },
        slideCount: proposal.slides.length,
      },
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
