import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  Prisma,
  SlideType,
  OptionKind,
  EventType,
  ProposalStatus
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.selection.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.option.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.proposalTemplate.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.org.deleteMany();

  const org = await prisma.org.create({
    data: {
      name: "Aurora Events",
      slug: "aurora-events"
    }
  });

  await prisma.user.create({
    data: {
      id: "11111111-1111-1111-1111-111111111111",
      orgId: org.id,
      email: "founder@aurora.events",
      name: "Avery Rivera",
      role: "admin"
    }
  });

  const [djBasic, djPro, lightingBasic, lightingPro] = await prisma.$transaction([
    prisma.catalogItem.create({
      data: {
        orgId: org.id,
        code: "DJ-BASIC",
        name: "DJ Essentials",
        description: "4-hour reception coverage with curated playlists",
        unit: "package",
        unitPrice: new Prisma.Decimal(1200),
        tags: ["dj", "core", "music"]
      }
    }),
    prisma.catalogItem.create({
      data: {
        orgId: org.id,
        code: "DJ-PRO",
        name: "DJ + MC Signature",
        description: "Full-day DJ and MC with custom intros and crowd analytics",
        unit: "package",
        unitPrice: new Prisma.Decimal(2100),
        tags: ["dj", "premium", "music"]
      }
    }),
    prisma.catalogItem.create({
      data: {
        orgId: org.id,
        code: "LIGHT-BASIC",
        name: "Atmosphere Lighting",
        description: "Uplights and dance floor wash for medium venues",
        unit: "package",
        unitPrice: new Prisma.Decimal(550),
        tags: ["lighting", "ambience"]
      }
    }),
    prisma.catalogItem.create({
      data: {
        orgId: org.id,
        code: "LIGHT-PRO",
        name: "Immersive Lighting + FX",
        description: "DMX programmed lighting with haze and cold spark intro",
        unit: "package",
        unitPrice: new Prisma.Decimal(980),
        tags: ["lighting", "premium"]
      }
    })
  ]);

  await prisma.asset.createMany({
    data: [
      {
        orgId: org.id,
        catalogItemId: djBasic.id,
        title: "Skyline Ballroom Mix",
        type: "image",
        url: "https://images.unsplash.com/photo-1525282410961-45b0a7a5e225",
        tags: ["dj", "core", "music"]
      },
      {
        orgId: org.id,
        catalogItemId: djPro.id,
        title: "Sunset Terrace First Dance",
        type: "video",
        url: "https://videos.pexels.com/video-files/856098/856098-hd_1280_720_30fps.mp4",
        tags: ["dj", "premium", "music"]
      },
      {
        orgId: org.id,
        catalogItemId: lightingBasic.id,
        title: "Warm Amber Package",
        type: "image",
        url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d4",
        tags: ["lighting", "ambience"]
      },
      {
        orgId: org.id,
        catalogItemId: lightingPro.id,
        title: "Cold Spark Reveal",
        type: "image",
        url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d4",
        tags: ["lighting", "premium"]
      }
    ]
  });

  const client = await prisma.client.create({
    data: {
      orgId: org.id,
      name: "Jamie & Alex",
      company: "Summit Ventures",
      email: "events@summitventures.com",
      phone: "+1-415-555-0123"
    }
  });

  const proposal = await prisma.proposal.create({
    data: {
      orgId: org.id,
      clientId: client.id,
      title: "Summit Ventures Launch Night",
      shareId: "dq-demo-aurora",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      status: ProposalStatus.SENT,
      theme: {
        primary: "#1E40AF",
        secondary: "#F97316",
        logo: "https://dummyimage.com/120x40/1E40AF/ffffff&text=Aurora"
      }
    }
  });

  await prisma.proposal.create({
    data: {
      orgId: org.id,
      clientId: client.id,
      title: "Summit Ventures Launch Night — Archived",
      shareId: "dq-demo-expired",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      status: ProposalStatus.EXPIRED,
      theme: {
        primary: "#334155",
        secondary: "#22D3EE",
        logo: "https://dummyimage.com/160x48/334155/ffffff&text=Aurora+Archive"
      }
    }
  });

  const [, choiceSlide, addOnSlide] = await prisma.$transaction([
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.INTRO,
        title: "Welcome to your launch night experience",
        subtitle: "A tailored outline of entertainment, ambiance, and acceptance steps.",
        position: 1,
        meta: {
          headline: "Summit Ventures product reveal",
          agenda: ["Cocktail hour soundscape", "Live launch moment", "After-party DJ"]
        }
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.CHOICE_CORE,
        title: "Choose your entertainment vibe",
        subtitle: "Each option includes setup, planning calls, and live mixing.",
        position: 2,
        options: {
          create: [
            {
              catalogItemId: djBasic.id,
              kind: OptionKind.ITEM,
              description: "Reception DJ for up to 200 guests",
              isDefault: true,
              defaultQty: 1
            },
            {
              catalogItemId: djPro.id,
              kind: OptionKind.ITEM,
              description: "Full-day DJ + MC with intelligent lighting",
              isDefault: false,
              defaultQty: 1
            },
            {
              kind: OptionKind.BUNDLE,
              description: "Hybrid: DJ Essentials + Atmosphere Lighting",
              priceOverride: new Prisma.Decimal(1650),
              isDefault: false,
              defaultQty: 1
            }
          ]
        }
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.ADDONS,
        title: "Enhance the experience",
        subtitle: "Add-ons can be toggled at any time.",
        position: 3,
        options: {
          create: [
            {
              catalogItemId: lightingBasic.id,
              kind: OptionKind.ITEM,
              description: "Ambient uplighting and dance floor wash",
              isAddOn: true,
              defaultQty: 1
            },
            {
              catalogItemId: lightingPro.id,
              kind: OptionKind.ITEM,
              description: "DMX lighting, haze, and cold spark intro",
              isAddOn: true,
              defaultQty: 1
            }
          ]
        }
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.PORTFOLIO,
        title: "See it in action",
        subtitle: "Portfolio curated based on your selections",
        position: 4,
        meta: {
          layout: "grid",
          columns: 3
        }
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.REVIEW,
        title: "Your investment overview",
        position: 5
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: SlideType.ACCEPT,
        title: "Lock it in",
        subtitle: "Sign & pay the deposit to confirm",
        position: 6
      }
    })
  ]);

  const defaultSelection = await prisma.selection.create({
    data: {
      proposalId: proposal.id,
      optionId: (await prisma.option.findFirstOrThrow({
        where: { slideId: choiceSlide.id, isDefault: true }
      })).id,
      qty: 1
    }
  });

  await prisma.selection.createMany({
    data: [
      {
        proposalId: proposal.id,
        optionId: (await prisma.option.findFirstOrThrow({
          where: { slideId: addOnSlide.id, catalogItemId: lightingBasic.id }
        })).id,
        qty: 1
      }
    ]
  });

  const subtotal = djBasic.unitPrice.add(lightingBasic.unitPrice);
  const tax = subtotal.mul(new Prisma.Decimal(0.21));
  const total = subtotal.add(tax);

  await prisma.quote.create({
    data: {
      proposalId: proposal.id,
      subtotal,
      tax,
      total,
      deposit: total.mul(new Prisma.Decimal(0.3)),
      currency: "EUR"
    }
  });

  const orderedSlides = await prisma.slide.findMany({
    where: { proposalId: proposal.id },
    orderBy: { position: "asc" },
    include: { options: true }
  });
  const introSlide = orderedSlides.find((slide) => slide.type === SlideType.INTRO);
  const choiceCoreSlide = orderedSlides.find((slide) => slide.type === SlideType.CHOICE_CORE);
  const addonsSlide = orderedSlides.find((slide) => slide.type === SlideType.ADDONS);
  const portfolioSlide = orderedSlides.find((slide) => slide.type === SlideType.PORTFOLIO);
  const reviewSlide = orderedSlides.find((slide) => slide.type === SlideType.REVIEW);
  const acceptSlide = orderedSlides.find((slide) => slide.type === SlideType.ACCEPT);

  const choiceOptions = choiceCoreSlide?.options ?? [];
  const addonOptions = addonsSlide?.options ?? [];

  const timelineStart = new Date(Date.now() - 1000 * 60 * 90);
  const atMinute = (minutes: number) => new Date(timelineStart.getTime() + minutes * 60 * 1000);
  const viewerPrimary = "viewer-seed-primary";
  const viewerSecondary = "viewer-seed-secondary";
  const acceptedSignature = randomUUID();

  await prisma.event.createMany({
    data: [
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(0),
        data: {
          viewerId: viewerPrimary,
          slideId: introSlide?.id,
          slideType: introSlide?.type,
          slideTitle: introSlide?.title,
          slideIndex: 0
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(2),
        data: {
          viewerId: viewerPrimary,
          slideId: choiceCoreSlide?.id,
          slideType: choiceCoreSlide?.type,
          slideTitle: choiceCoreSlide?.title,
          slideIndex: 1
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.SELECT,
        createdAt: atMinute(3),
        data: {
          viewerId: viewerPrimary,
          optionId: choiceOptions[0]?.id,
          optionLabel: choiceOptions[0]?.description,
          quantity: 1,
          slideId: choiceCoreSlide?.id
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(6),
        data: {
          viewerId: viewerPrimary,
          slideId: addonsSlide?.id,
          slideType: addonsSlide?.type,
          slideTitle: addonsSlide?.title,
          slideIndex: 2
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.SELECT,
        createdAt: atMinute(7),
        data: {
          viewerId: viewerPrimary,
          optionId: addonOptions[0]?.id,
          optionLabel: addonOptions[0]?.description,
          quantity: 1,
          slideId: addonsSlide?.id
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(9),
        data: {
          viewerId: viewerPrimary,
          slideId: portfolioSlide?.id,
          slideType: portfolioSlide?.type,
          slideTitle: portfolioSlide?.title,
          slideIndex: 3
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.PORTFOLIO_OPEN,
        createdAt: atMinute(9),
        data: {
          viewerId: viewerPrimary,
          slideId: portfolioSlide?.id
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(11),
        data: {
          viewerId: viewerPrimary,
          slideId: reviewSlide?.id,
          slideType: reviewSlide?.type,
          slideTitle: reviewSlide?.title,
          slideIndex: 4
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(14),
        data: {
          viewerId: viewerPrimary,
          slideId: acceptSlide?.id,
          slideType: acceptSlide?.type,
          slideTitle: acceptSlide?.title,
          slideIndex: 5
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.ACCEPT,
        createdAt: atMinute(16),
        data: {
          viewerId: viewerPrimary,
          signatureId: acceptedSignature
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.PAY,
        createdAt: atMinute(25),
        data: {
          viewerId: viewerPrimary,
          amount: Number(total) * 0.3
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(5),
        data: {
          viewerId: viewerSecondary,
          slideId: introSlide?.id,
          slideType: introSlide?.type,
          slideTitle: introSlide?.title,
          slideIndex: 0
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(8),
        data: {
          viewerId: viewerSecondary,
          slideId: choiceCoreSlide?.id,
          slideType: choiceCoreSlide?.type,
          slideTitle: choiceCoreSlide?.title,
          slideIndex: 1
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.SELECT,
        createdAt: atMinute(9),
        data: {
          viewerId: viewerSecondary,
          optionId: choiceOptions[1]?.id,
          optionLabel: choiceOptions[1]?.description,
          quantity: 1,
          slideId: choiceCoreSlide?.id
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.DESELECT,
        createdAt: atMinute(10),
        data: {
          viewerId: viewerSecondary,
          optionId: choiceOptions[1]?.id,
          optionLabel: choiceOptions[1]?.description,
          quantity: 0,
          slideId: choiceCoreSlide?.id
        }
      },
      {
        proposalId: proposal.id,
        type: EventType.VIEW,
        createdAt: atMinute(12),
        data: {
          viewerId: viewerSecondary,
          slideId: reviewSlide?.id,
          slideType: reviewSlide?.type,
          slideTitle: reviewSlide?.title,
          slideIndex: 4
        }
      }
    ]
  });

  await prisma.pricingRule.create({
    data: {
      orgId: org.id,
      name: "Tiered launch night savings",
      type: "discount_threshold_pct",
      config: {
        thresholds: [
          { minimum: 1500, percentage: 8 },
          { minimum: 2500, percentage: 12 }
        ],
        appliesToTags: ["lighting", "dj"]
      }
    }
  });

  await prisma.proposalTemplate.create({
    data: {
      orgId: org.id,
      title: "Launch Event Template",
      description: "Baseline template combining DJ, lighting, and review slides",
      theme: {
        accent: "#06B6D4"
      },
      slides: {
        create: [
          {
            type: SlideType.INTRO,
            title: "Set the stage",
            position: 1
          },
          {
            type: SlideType.CHOICE_CORE,
            title: "Entertainment tier",
            position: 2
          },
          {
            type: SlideType.ADDONS,
            title: "Enhancements",
            position: 3
          },
          {
            type: SlideType.PORTFOLIO,
            title: "Proof points",
            position: 4
          },
          {
            type: SlideType.REVIEW,
            title: "Investment overview",
            position: 5
          },
          {
            type: SlideType.ACCEPT,
            title: "Next steps",
            position: 6
          }
        ]
      }
    }
  });

  console.log(`Seeded org ${org.name} with proposal ${proposal.title} and default selection ${defaultSelection.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
