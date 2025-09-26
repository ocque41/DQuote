import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/server/prisma";

export interface ViewerContext {
  supabaseUser: SupabaseUser;
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
  const supabase = getServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to fetch Supabase user", error.message);
    return null;
  }

  if (!user) {
    return null;
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { org: true }
  });

  if (!dbUser || !dbUser.org) {
    const fallbackOrg = await prisma.org.findFirst({ orderBy: { createdAt: "asc" } });
    if (!fallbackOrg) {
      return null;
    }
    const fullName = typeof user.user_metadata?.full_name === "string" ? (user.user_metadata.full_name as string) : null;
    const email = user.email ?? dbUser?.email ?? `user-${user.id}@example.com`;
    dbUser = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        orgId: fallbackOrg.id,
        email,
        name: fullName ?? email,
        role: dbUser?.role ?? "admin"
      },
      update: {
        orgId: fallbackOrg.id,
        email,
        name: fullName ?? email,
        role: dbUser?.role ?? "admin"
      },
      include: { org: true }
    });
  }

  return {
    supabaseUser: user,
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
