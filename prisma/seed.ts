import { PrismaClient, Prisma } from "@prisma/client";

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
        url: "https://images.unsplash.com/photo-1525282410961-45b0a7a5e225"
      },
      {
        orgId: org.id,
        catalogItemId: djPro.id,
        title: "Sunset Terrace First Dance",
        type: "video",
        url: "https://videos.pexels.com/video-files/856098/856098-hd_1280_720_30fps.mp4"
      },
      {
        orgId: org.id,
        catalogItemId: lightingBasic.id,
        title: "Warm Amber Package",
        type: "image",
        url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d4"
      },
      {
        orgId: org.id,
        catalogItemId: lightingPro.id,
        title: "Cold Spark Reveal",
        type: "image",
        url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d4"
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
      status: "SENT",
      theme: {
        primary: "#1E40AF",
        secondary: "#F97316",
        logo: "https://dummyimage.com/120x40/1E40AF/ffffff&text=Aurora"
      }
    }
  });

  const slides = await prisma.$transaction([
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: "CHOICE",
        title: "Choose your entertainment vibe",
        subtitle: "Each option includes setup, planning calls, and live mixing.",
        position: 1,
        options: {
          create: [
            {
              catalogItemId: djBasic.id,
              kind: "item",
              description: "Reception DJ for up to 200 guests",
              isDefault: true,
              defaultQty: 1
            },
            {
              catalogItemId: djPro.id,
              kind: "item",
              description: "Full-day DJ + MC with intelligent lighting",
              isDefault: false,
              defaultQty: 1
            },
            {
              kind: "bundle",
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
        type: "CHOICE",
        title: "Enhance the experience",
        subtitle: "Add-ons can be toggled at any time.",
        position: 2,
        options: {
          create: [
            {
              catalogItemId: lightingBasic.id,
              kind: "item",
              description: "Ambient uplighting and dance floor wash",
              isAddOn: true,
              defaultQty: 1
            },
            {
              catalogItemId: lightingPro.id,
              kind: "item",
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
        type: "PORTFOLIO",
        title: "See it in action",
        subtitle: "Portfolio curated based on your selections",
        position: 3,
        meta: {
          layout: "grid",
          columns: 3
        }
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: "REVIEW",
        title: "Your investment overview",
        position: 4
      }
    }),
    prisma.slide.create({
      data: {
        proposalId: proposal.id,
        type: "ACCEPT",
        title: "Lock it in",
        subtitle: "Sign & pay the deposit to confirm",
        position: 5
      }
    })
  ]);

  const [choiceSlide, addOnSlide] = slides;

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

  await prisma.event.createMany({
    data: [
      {
        proposalId: proposal.id,
        type: "view",
        data: { slide: 1 }
      },
      {
        proposalId: proposal.id,
        type: "select",
        data: { optionCode: "DJ-BASIC" }
      }
    ]
  });

  await prisma.pricingRule.create({
    data: {
      orgId: org.id,
      name: "Bundle lighting with DJ",
      type: "discount_pct",
      config: {
        triggerTags: ["lighting", "dj"],
        percentage: 5
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
            type: "CHOICE",
            title: "Entertainment tier",
            position: 1
          },
          {
            type: "CHOICE",
            title: "Enhancements",
            position: 2
          },
          {
            type: "PORTFOLIO",
            title: "Proof points",
            position: 3
          },
          {
            type: "ACCEPT",
            title: "Next steps",
            position: 4
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
