"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push("/app/sign-in");
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
