'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStackApp } from '@stackframe/stack';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const stackApp = useStackApp();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Let Stack Auth handle the OAuth callback
        const handled = await stackApp.callOAuthCallback();

        if (handled) {
          // OAuth callback was handled successfully, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // OAuth callback was not handled, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        // Redirect to login with error indication
        router.replace('/login?error=oauth_callback_failed');
      }
    };

    handleOAuthCallback();
  }, [router, stackApp]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="size-8 mx-auto animate-spin rounded-full border-2 border-primary border-r-transparent mb-4" />
        <p className="text-sm text-muted-foreground">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}