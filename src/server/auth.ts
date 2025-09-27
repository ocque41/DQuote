import { requireUser } from "@/auth/requireUser";
import { prisma } from "@/server/prisma";
import { getStackServerApp } from "@/stack/server";

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

type StackServerAppInstance = ReturnType<typeof getStackServerApp>;
type StackUser = Exclude<Awaited<ReturnType<StackServerAppInstance["getUser"]>>, null>;

export async function getViewerContext(currentUser?: StackUser): Promise<ViewerContext | null> {
  let stackUser = currentUser;

  if (!stackUser) {
    const sessionResult = await requireUser({ redirectTo: "/handler/sign-in" });

    if ("redirect" in sessionResult) {
      return null;
    }

    stackUser = sessionResult.user;
  }

  const email = stackUser.primaryEmail?.toLowerCase();

  if (!email) {
    return null;
  }

  const displayName = stackUser.displayName ?? email;

  let member = await prisma.orgMember.findFirst({
    where: { userId: stackUser.id },
    include: { org: true }
  });

  if (!member) {
    const fallbackOrg = await prisma.org.findFirst({ orderBy: { createdAt: "asc" } });
    if (!fallbackOrg) {
      return null;
    }

    member = await prisma.orgMember.create({
      data: {
        orgId: fallbackOrg.id,
        userId: stackUser.id,
        email,
        name: displayName,
        role: "admin"
      },
      include: { org: true }
    });
  } else {
    const updates: Record<string, string | null> = {};
    if (member.email !== email) {
      updates.email = email;
    }
    if (member.name !== displayName) {
      updates.name = displayName;
    }

    if (Object.keys(updates).length > 0) {
      member = await prisma.orgMember.update({
        where: { id: member.id },
        data: updates,
        include: { org: true }
      });
    }
  }

  if (!member?.org) {
    return null;
  }

  return {
    sessionUser: {
      id: stackUser.id,
      email,
      name: stackUser.displayName,
      role: member.role ?? null
    },
    orgUser: {
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role ?? null
    },
    org: {
      id: member.org.id,
      name: member.org.name,
      slug: member.org.slug
    }
  };
}
