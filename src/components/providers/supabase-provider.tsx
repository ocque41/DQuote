"use client";

import { Session, SupabaseClient } from "@supabase/supabase-js";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { PropsWithChildren, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SupabaseProviderProps extends PropsWithChildren {
  session: Session | null;
}

export function SupabaseProvider({ session, children }: SupabaseProviderProps) {
  const [client] = useState<SupabaseClient>(() => createSupabaseBrowserClient());

  return (
    <SessionContextProvider supabaseClient={client} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
