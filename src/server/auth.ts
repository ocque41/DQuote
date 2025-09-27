import { prisma } from "@/server/prisma";
import { auth } from "@auth";

export interface ViewerContext {
  sessionUser: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  };
  orgUser: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  };
  org: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const email = session.user.email.toLowerCase();

  let dbUser = await prisma.user.findUnique({
    where: { email },
    include: { org: true }
  });

  if (!dbUser || !dbUser.org) {
    const fallbackOrg = await prisma.org.findFirst({ orderBy: { createdAt: "asc" } });
    if (!fallbackOrg) {
      return null;
    }
    const displayName = session.user.name ?? dbUser?.name ?? email;
    dbUser = await prisma.user.upsert({
      where: { email },
      create: {
        orgId: fallbackOrg.id,
        email,
        name: displayName,
        role: dbUser?.role ?? "admin"
      },
      update: {
        orgId: fallbackOrg.id,
        email,
        name: displayName,
        role: dbUser?.role ?? "admin"
      },
      include: { org: true }
    });
  }

  if (!dbUser?.org) {
    return null;
  }

  return {
    sessionUser: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role ?? null
    },
    orgUser: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role ?? null
    },
    org: {
      id: dbUser.org.id,
      name: dbUser.org.name,
      slug: dbUser.org.slug
    }
  };
}
