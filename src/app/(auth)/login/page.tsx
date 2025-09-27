import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-5xl">
        <AuthCard mode="login" />
      </div>
    </div>
  );
}
