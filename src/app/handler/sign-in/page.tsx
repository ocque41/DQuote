import { redirect } from 'next/navigation';

export default async function SignInHandlerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Extract any redirect parameter
  const redirectTo = typeof params.redirect === 'string' ? params.redirect : '/dashboard';

  // Redirect to login page with the redirect parameter preserved
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  redirect(loginUrl);
}