# Stack Auth Domain Configuration for dquote.cumulush.com

This guide covers configuring Stack Auth (Neon Auth) for production deployment at `https://dquote.cumulush.com`.

## 1. Stack Auth Dashboard Configuration

### Access Your Stack Auth Project
1. Go to the [Stack Auth Dashboard](https://app.stack-auth.com/) (or Neon Console → Auth)
2. Select your project: `a139eba7-bac6-410a-ac6a-4e274ee81fac`

### Configure Allowed Domains

#### A. Add Production Domain
Navigate to **Project Settings** → **Domains** and add:

**Allowed Origins:**
```
https://dquote.cumulush.com
http://localhost:3000
```

**Redirect URIs:**
```
https://dquote.cumulush.com/handler/sign-in
https://dquote.cumulush.com/handler/sign-up
https://dquote.cumulush.com/handler/oauth-callback
https://dquote.cumulush.com/handler/reset-password
http://localhost:3000/handler/sign-in
http://localhost:3000/handler/sign-up
http://localhost:3000/handler/oauth-callback
http://localhost:3000/handler/reset-password
```

**Sign-out Redirect URIs:**
```
https://dquote.cumulush.com
http://localhost:3000
```

#### B. Configure OAuth Providers (if enabled)

For each OAuth provider (Google, GitHub, etc.), add the callback URL:
```
https://dquote.cumulush.com/handler/oauth-callback
```

## 2. Environment Variables

### Production Environment (.env.production or Vercel Environment Variables)

```bash
# Database (Neon + Prisma)
DATABASE_URL="postgresql://neondb_owner:npg_SJT3Vjng9CxG@ep-aged-brook-adu0ysrq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_SJT3Vjng9CxG@ep-aged-brook-adu0ysrq.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Neon Auth (Stack Auth) - KEEP THESE THE SAME
NEXT_PUBLIC_STACK_PROJECT_ID="a139eba7-bac6-410a-ac6a-4e274ee81fac"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_07s1d527m494fjqqr5zpk5z1tw05ghmzpfw27dpavj9fg"
STACK_SECRET_SERVER_KEY="ssk_bjwg3n1x357983w2n4sw3xwepqd51jyha7z1qkxxj8ywg"

# Application - UPDATE THIS FOR PRODUCTION
NEXT_PUBLIC_APP_URL="https://dquote.cumulush.com"

# Vercel Blob storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."  # Use live keys for production
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email SMTP
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="DQuote <noreply@cumulush.com>"

# Security
ENCRYPTION_KEY="generate_a_32_char_random_key_here"
```

## 3. Vercel Deployment Configuration

### A. Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the variables above
4. Make sure to set them for **Production** environment

### B. Domain Configuration

1. In Vercel, go to **Settings** → **Domains**
2. Add `dquote.cumulush.com` as a custom domain
3. Configure DNS records as instructed by Vercel

### C. Build Settings

Ensure your build settings are correct:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (or default)
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install`

## 4. Stack Auth Handler Routes

The following routes are automatically created by Stack Auth and must be accessible:

- `/handler/sign-in` - Sign in page
- `/handler/sign-up` - Sign up page
- `/handler/sign-out` - Sign out handler
- `/handler/oauth-callback` - OAuth provider callback
- `/handler/reset-password` - Password reset flow
- `/handler/email-verification` - Email verification
- `/handler/account-settings` - User account settings

**Note**: These routes are created by the `npx @stackframe/init-stack` setup script.

## 5. Testing the Configuration

### A. Test Authentication Flow

1. Deploy to production
2. Visit `https://dquote.cumulush.com`
3. Click "Sign In" → Should redirect to Stack Auth sign-in page
4. Sign up with a new account
5. Verify email (if email verification is enabled)
6. Check that you're redirected back to the app

### B. Test OAuth (if configured)

1. Click "Sign in with Google" (or other provider)
2. Authorize the app
3. Verify redirect to `https://dquote.cumulush.com/handler/oauth-callback`
4. Check successful login

### C. Check Session Persistence

1. Sign in to your app
2. Navigate to different pages
3. Close browser and reopen
4. Verify you're still logged in

## 6. Database User Sync

Stack Auth automatically syncs users to your Neon database via the `neon_auth.users_sync` table.

Verify the sync is working:

```sql
SELECT id, email, name, created_at
FROM neon_auth.users_sync
ORDER BY created_at DESC
LIMIT 10;
```

## 7. Common Issues & Troubleshooting

### Issue: "Invalid redirect URI"
**Solution**: Ensure the exact redirect URI is added in Stack Auth dashboard, including protocol (https://)

### Issue: "CORS error"
**Solution**: Add `https://dquote.cumulush.com` to allowed origins in Stack Auth settings

### Issue: "Session not persisting"
**Solution**:
- Check that cookies are allowed in browser
- Verify `NEXT_PUBLIC_APP_URL` matches your production domain
- Ensure Stack Auth domains include your production URL

### Issue: "OAuth callback fails"
**Solution**:
- Check OAuth provider callback URL matches: `https://dquote.cumulush.com/handler/oauth-callback`
- Verify OAuth credentials are set in Stack Auth dashboard

## 8. Security Checklist

- [ ] Production environment variables are set in Vercel (not in code)
- [ ] `STACK_SECRET_SERVER_KEY` is kept secret and never exposed to client
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] CSP headers are configured (optional but recommended)
- [ ] Rate limiting is enabled on auth endpoints (Stack Auth handles this)
- [ ] Email verification is enabled for production
- [ ] Strong password requirements are configured

## 9. Post-Deployment

After successful deployment:

1. **Update .env.example** to reflect production setup (without secrets)
2. **Test all auth flows**: Sign up, Sign in, Sign out, Password reset
3. **Monitor logs** for any auth-related errors
4. **Set up monitoring** for failed login attempts
5. **Configure email templates** in Stack Auth dashboard for better branding

## 10. Support

- **Stack Auth Docs**: https://docs.stack-auth.com
- **Neon Auth Docs**: https://neon.tech/docs/guides/neon-authorize
- **DQuote Support**: Check the main README.md for additional configuration

---

**Last Updated**: 2025-01-XX
**Environment**: Production
**Domain**: https://dquote.cumulush.com
