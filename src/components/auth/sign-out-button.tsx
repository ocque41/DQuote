"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const result = await signOut({ redirect: false, callbackUrl: "/app/sign-in" });
      router.push(result?.url ?? "/app/sign-in");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isLoading}>
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
