# Security Spec

## Data Invariants
1. A user can only access their own profile (profiles/{userId}).
2. A surgery must belong to the authenticated user (`userId == request.auth.uid`).
3. A patient must belong to the authenticated user (`userId == request.auth.uid`).
4. Fields `userId` and `id` are immutable after creation.
5. `creadoEl` / `fechaCreacion` must be set via server timestamp, or since it's an offline-first friendly app, we might allow string ISO dates but they must be valid strings.

## Dirty Dozen Payloads
1. Create a profile for another user.
2. Read a profile belonging to another user.
3. Create a patient with someone else's `userId`.
4. Read a patient belonging to someone else.
5. Update a patient to change the `userId`.
6. Update a patient with invalid types (e.g. `edad` is a string).
7. Create a surgery with someone else's `userId`.
8. Read a surgery belonging to someone else.
9. Update a surgery to change the `userId`.
10. Update a surgery with missing required finance fields.
11. Add a massive string to `notasFinancieras`.
12. Create a surgery without an existing patient (referential integrity, though not strictly required if patient is synced concurrently, but we should enforce it).
