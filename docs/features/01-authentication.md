# 01 Authentication

## Purpose

Let known people sign in with email and password. Keep strangers out. Give admins a way to add and remove accounts fast.

## Users

- Admin: creates accounts, resets passwords, revokes sessions.
- Viewer: signs in and reads linked projects only.

## Behavior

- Sign in page at `/login` with email and password fields, shadcn form and error states.
- Credentials provider in next-auth. Passwords hashed at rest. Compare with constant time check.
- First account is seeded by env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) on first boot, then forced to change password on first login.
- Sessions use JWT (v4 supports Credentials only with JWT). The session callback reloads the user row on every call, so deactivating a user locks them out on next request. Cookie is httpOnly, secure in prod, sameSite lax.
- Sign out clears the session row and redirects to `/login`.
- Rate limit login: 5 tries per 15 minutes per IP plus per email. Show generic "email or password is wrong" to avoid user probing.
- Password rules: min 10 chars. No complexity quiz. Block top 10k common passwords with a small list.

## Data

- Uses next-auth tables: `users`, `accounts`, `sessions`, `verificationTokens`.
- User row adds `role` (admin, editor, viewer) and `isActive`. Inactive users fail sign in with the same generic message.

## UI

- shadcn Card centered on `/login`, password input with show toggle, "forgot password" link goes to "contact your admin" in v1.
- Admin users table shows name, email, role, active flag, last login. Actions: deactivate, reset password, revoke sessions.

## Edge cases

- Inactive user with valid password: same error as wrong password.
- Deleted user with live cookie: `getServerSession` returns null, middleware redirects to `/login`.
- DB down at login: 500 page with retry, no stack trace to client.

## Out of scope for v1

- Self signup, public invite links, magic links, 2FA. Add only after client count grows.
