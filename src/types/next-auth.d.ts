import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      orgId?: string | null;
      role?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    orgId?: string | null;
    role?: string | null;
    passwordHash?: string | null;
  }
}
