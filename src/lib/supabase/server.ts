import { cookies, headers } from "next/headers";

import { createRouteHandlerClient, createServerActionClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

function createStubClient(): SupabaseClient {
  const stubAuth = {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    }
  } as SupabaseClient["auth"];

  return { auth: stubAuth } as SupabaseClient;
}

export function getServerSupabaseClient() {
  const cookieStore = cookies();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return createStubClient();
  }
  return createServerComponentClient({ cookies: () => cookieStore });
}

export function getRouteHandlerSupabaseClient() {
  const cookieStore = cookies();
  const headerList = headers();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return createStubClient();
  }
  return createRouteHandlerClient({ cookies: () => cookieStore, headers: () => headerList });
}

export function getServerActionSupabaseClient() {
  const cookieStore = cookies();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return createStubClient();
  }
  return createServerActionClient({ cookies: () => cookieStore });
}
