"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { PropsWithChildren } from "react";

interface SessionProviderProps extends PropsWithChildren {
  session: Session | null;
}

export function AuthSessionProvider({ session, children }: SessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
