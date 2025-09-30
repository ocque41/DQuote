import { redirect } from 'next/navigation';

export default function SignInHandlerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract any redirect parameter
  const redirectTo = typeof searchParams.redirect === 'string' ? searchParams.redirect : '/dashboard';

  // Redirect to login page with the redirect parameter preserved
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  redirect(loginUrl);
}