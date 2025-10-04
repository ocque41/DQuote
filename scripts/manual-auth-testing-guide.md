# Phase 3: Manual Authentication Testing Guide

## Overview
This guide provides step-by-step manual testing procedures to validate the complete authentication system including user registration, login flows, protected route access, and organization-scoped data access.

## Prerequisites
- Application running on `http://localhost:3000`
- Clean browser session (incognito/private mode recommended)
- Demo credentials: `founder@aurora.events` / `dquote-demo`

---

## Test Suite 1: User Registration Flow

### Test 1.1: New User Registration
**Objective**: Verify new user can register successfully

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Verify page loads with signup form
3. Enter new email: `test-user-$(date +%s)@example.com`
4. Enter password: `SecurePassword123!`
5. Submit registration form
6. Verify successful registration and redirect to dashboard

**Expected Results**:
- ✅ Signup page loads without errors
- ✅ Form accepts valid email/password
- ✅ User is automatically logged in after registration
- ✅ Redirected to `/dashboard`
- ✅ Dashboard shows user-specific content

### Test 1.2: Registration Input Validation
**Objective**: Verify form validation works correctly

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Test invalid email formats: `invalid-email`, `@domain.com`
3. Test weak passwords: `123`, `password`
4. Test empty fields

**Expected Results**:
- ✅ Invalid email shows appropriate error
- ✅ Weak password shows strength requirements
- ✅ Required field validation prevents submission

---

## Test Suite 2: User Login Flow

### Test 2.1: Existing User Login
**Objective**: Verify existing user can login successfully

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Enter demo credentials: `founder@aurora.events` / `dquote-demo`
3. Submit login form
4. Verify successful login and redirect

**Expected Results**:
- ✅ Login page loads without errors
- ✅ Valid credentials accepted
- ✅ User redirected to dashboard
- ✅ User session persists across page reloads

### Test 2.2: Invalid Login Attempts
**Objective**: Verify security for invalid credentials

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Test invalid email: `nonexistent@example.com`
3. Test wrong password for valid email
4. Test malformed input

**Expected Results**:
- ✅ Invalid credentials show appropriate error
- ✅ No sensitive information leaked in errors
- ✅ Form remains functional after failed attempts

### Test 2.3: Login Redirect Flow
**Objective**: Verify redirect after login works correctly

**Steps**:
1. While logged out, try to access `http://localhost:3000/dashboard`
2. Note if redirected to login with return URL
3. Complete login process
4. Verify redirected back to originally requested page

**Expected Results**:
- ✅ Protected page redirects to login
- ✅ Return URL preserved during login
- ✅ User redirected to original destination after login

---

## Test Suite 3: Protected Route Access

### Test 3.1: Dashboard Access Control
**Objective**: Verify dashboard requires authentication

**Steps**:
1. Log out (if logged in)
2. Navigate to `http://localhost:3000/dashboard`
3. Verify redirect to login
4. Login with demo credentials
5. Verify dashboard loads with user data

**Expected Results**:
- ✅ Unauthenticated access redirects to login
- ✅ Authenticated access shows dashboard
- ✅ Dashboard displays user-specific data
- ✅ Navigation elements show user context

### Test 3.2: App Routes Protection
**Objective**: Verify all app routes require authentication

**Protected Routes to Test**:
- `/dashboard`
- `/items`
- `/quotes`
- `/proposals`

**Steps** (for each route):
1. Log out completely
2. Navigate directly to protected route
3. Verify authentication required
4. Login and verify access granted

**Expected Results**:
- ✅ All protected routes require authentication
- ✅ Consistent redirect behavior
- ✅ Proper access after authentication

---

## Test Suite 4: Session Management

### Test 4.1: Session Persistence
**Objective**: Verify user sessions persist correctly

**Steps**:
1. Login with demo credentials
2. Reload the page
3. Open new tab to same domain
4. Close and reopen browser (same session)

**Expected Results**:
- ✅ Session persists across page reloads
- ✅ Session persists across new tabs
- ✅ Session behavior consistent

### Test 4.2: Logout Functionality
**Objective**: Verify logout works correctly

**Steps**:
1. Login with demo credentials
2. Navigate to dashboard
3. Find and click logout option
4. Verify logout completion
5. Try to access protected routes

**Expected Results**:
- ✅ Logout option available in UI
- ✅ Logout clears session
- ✅ Protected routes require re-authentication
- ✅ No cached sensitive data accessible

---

## Test Suite 5: Organization-Scoped Data Access

### Test 5.1: Single Organization View
**Objective**: Verify users only see their organization's data

**Steps**:
1. Login with demo credentials (`founder@aurora.events`)
2. Navigate to dashboard
3. Check proposals, clients, and other data shown
4. Note organization context indicators

**Expected Results**:
- ✅ Only Aurora Events organization data visible
- ✅ Organization name/context displayed in UI
- ✅ No cross-organization data leakage

### Test 5.2: API Data Scoping (Browser Developer Tools)
**Objective**: Verify API calls are organization-scoped

**Steps**:
1. Login with demo credentials
2. Open browser developer tools (Network tab)
3. Navigate to dashboard and proposals
4. Examine API calls made (e.g., to `/api/pricing`)
5. Check request headers and responses

**Expected Results**:
- ✅ API calls include proper authentication headers
- ✅ API responses contain only org-scoped data
- ✅ No sensitive data in client-side JavaScript

---

## Test Suite 6: Error Handling and Edge Cases

### Test 6.1: Network Interruption
**Objective**: Verify graceful handling of network issues

**Steps**:
1. Login successfully
2. Disconnect internet/block network in developer tools
3. Try to navigate or perform actions
4. Reconnect network
5. Verify recovery

**Expected Results**:
- ✅ Appropriate error messages shown
- ✅ No application crashes
- ✅ Graceful recovery when network restored

### Test 6.2: Session Expiration
**Objective**: Verify handling of expired sessions

**Steps**:
1. Login successfully
2. Wait for extended period (if session timeout configured)
3. Or simulate by clearing server-side session
4. Try to access protected resources

**Expected Results**:
- ✅ Expired session detected
- ✅ User redirected to login
- ✅ Clear messaging about re-authentication needed

---

## Test Suite 7: Real User Session API Testing

### Test 7.1: Authenticated API Calls
**Objective**: Verify APIs work with real user sessions

**Browser Console Testing** (after logging in):
```javascript
// Test pricing API with demo proposal
fetch('/api/pricing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proposalId: 'real-proposal-id', // Use actual ID from dashboard
    selections: []
  })
}).then(r => r.json()).then(console.log);

// Test proposals API
fetch('/api/proposals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'user-org-id', // Use actual org ID
    clientId: 'real-client-id',
    title: 'Test Proposal'
  })
}).then(r => r.json()).then(console.log);
```

**Expected Results**:
- ✅ Authenticated API calls return data
- ✅ Unauthenticated calls return 401
- ✅ Cross-organization access denied (403)
- ✅ Proper error messages for invalid requests

---

## Test Suite 8: Stack Auth Integration

### Test 8.1: OAuth Providers (if configured)
**Objective**: Test OAuth login flows

**Steps**:
1. Navigate to login page
2. Check for OAuth provider buttons (Google, GitHub, etc.)
3. Test OAuth flow if available
4. Verify successful authentication

**Expected Results**:
- ✅ OAuth buttons functional (if configured)
- ✅ OAuth flow completes successfully
- ✅ User profile data populated correctly

### Test 8.2: Password Reset Flow (if available)
**Objective**: Test password reset functionality

**Steps**:
1. Navigate to login page
2. Click "Forgot Password" or similar
3. Enter email address
4. Check for reset email/instructions

**Expected Results**:
- ✅ Password reset option available
- ✅ Reset process functional
- ✅ Appropriate user feedback provided

---

## Test Results Documentation

### Success Criteria
- [ ] All registration flows work correctly
- [ ] All login flows work correctly
- [ ] All protected routes require authentication
- [ ] Session management works as expected
- [ ] Organization data scoping enforced
- [ ] Error handling is graceful
- [ ] API authentication works with real sessions
- [ ] Stack Auth integration functional

### Test Environment
- **Date**: ___________
- **Browser**: ___________
- **Application Version**: ___________
- **Tester**: ___________

### Notes and Issues
_Document any issues, unexpected behavior, or areas for improvement_

---

## Quick Validation Checklist

For rapid validation, complete these essential tests:

1. ✅ Login page loads (`/login`)
2. ✅ Demo login works (`founder@aurora.events` / `dquote-demo`)
3. ✅ Dashboard loads after login (`/dashboard`)
4. ✅ Logout works and requires re-authentication
5. ✅ Protected routes redirect when not authenticated
6. ✅ API calls work when authenticated, fail when not
7. ✅ Only organization-scoped data visible

**Status**: 🟢 All Essential Tests Pass | 🟡 Some Issues Found | 🔴 Critical Issues

---

*This guide complements the automated testing in `test-auth-phase3.js` with human verification of the complete user experience.*
