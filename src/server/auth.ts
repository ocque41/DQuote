import { requireUser } from "@/auth/requireUser";
import { prisma } from "@/server/prisma";
import { getStackServerApp } from "@/stack/server";

function normalizeOrgName(displayName: string | null, email: string) {
  const fallback = email.replace(/@.+$/, "").trim() || "Workspace";
  const nameSource = displayName?.trim() || fallback;
  return `${nameSource} Workspace`;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildOrgSlug(name: string, userId: string) {
  const base = toSlug(name) || "workspace";
  const suffix = userId.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8) || "team";
  return `${base}-${suffix}`;
}

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
    const sessionResult = await requireUser();

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
    let org = await prisma.org.findFirst({ orderBy: { createdAt: "asc" } });

    if (!org) {
      const orgName = normalizeOrgName(stackUser.displayName, email);
      const orgSlug = buildOrgSlug(orgName, stackUser.id);

      org = await prisma.org.create({
        data: {
          name: orgName,
          slug: orgSlug,
        },
      });
    }

    member = await prisma.orgMember.create({
      data: {
        orgId: org.id,
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
