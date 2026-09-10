---
id: "account-profile-2026-09-10"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T22:00:00.000Z"
modified: "2026-09-10T22:45:00.000Z"
labels: ["auth", "ux"]
order: 31
---

# Account profile

Safi asked for the name instead of the email in the top bar, and a way to change name and email, not only the password.

- [x] Top bar shows the person's name (email when there is no name), linking to the account page.
- [x] `/account`: a profile form (name, email) above the password form. Changing your own email asks for your current password, since the email is how you sign in.
- [x] Admins can change another person's email from the Users edit dialog (name was already editable there).
- [x] Emails stay unique and lowercase; the forced first-login flow still goes to the password form alone.
- [x] Checks in `lib/users/users.check.ts`.

What shipped:

- `TopBar` takes `name` (name, else email) and links to `/account`; on phones it is the person icon, which also closes the old "no change-password link on phones" gap.
- `/account`: `ProfileForm` (name, email; the current-password field appears only when the email changes) above `PasswordForm`. `/account/password` stays for the forced first-login change and redirects everyone else to `/account`.
- `updateOwnProfile()` and an `email` option on `updateUser()` in `lib/users/users.ts`, sharing `cleanEmail` / `assertEmailFree` / `cleanName` with `createUser`. Checked over HTTP: rename, email refused without or with a wrong password, taken email refused, right password saves and the session stays.
- Also fixed: a deactivated user's row faded its own actions menu (`opacity-50` on the row); only the detail cells dim now, and the menu is wide enough for one-line items.
- Vault docs (`users-and-access.md`, `reading-docs.md`) updated.
