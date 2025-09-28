import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-2">
      {/* Left column - Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      {/* Right column - Cover image */}
      <div className="relative hidden bg-gradient-to-br from-primary/20 to-primary/40 via-transparent md:block">
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end gap-6 p-8">
          <div className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            DQuote Auth
          </div>
          <h2 className="text-lg font-semibold text-primary-foreground">
            Interactive proposals that close deals faster
          </h2>
          <p className="text-sm text-primary-foreground/70">
            Built with Neon Auth for enterprise-grade security and seamless team collaboration.
          </p>
        </div>
      </div>
    </div>
  );
}
