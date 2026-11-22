Friends Module: Backend Functional & Technical Specification
Platform: Java 17+, Spring Boot, Spring Security/JWT, PostgreSQL
Status: Proposed backend implementation contract; adapted from supplied Friends module source
Database: PostgreSQL (consistent with Expensio's selected backend direction)
1. Purpose and boundaries
The Friends service is the authoritative system for account-to-account requests, accepted relationships, guest participant creation, guest ownership, and relationship removal. It exposes secure REST endpoints to the React Native app and participant lookup to Splits/Groups. It does not calculate balances, own split entries, or authorize settlement independently of Splits.
2. Domain entities and rules
Entity	Key fields	Rules
users / user_profiles	UUID user ID, username, display name, avatar, account type	Reuse existing Expensio identity/profile model; avoid a second independently login-capable guest account
friendships	UUID id, requester_id, addressee_id, status, created_at, accepted_at	Distinct endpoints; only PENDING or ACCEPTED active
guest_profiles (or compatible profile extension)	UUID id, owner_user_id, name, username, avatar_id, created_at	Non-authenticating participant, owner-scoped; guest IDs usable in Splits
Participant snapshot	Participant UUID, display name/avatar/guest flag captured for history	Preserves historical identity after friendship removal or guest retirement


Compatibility note: the supplied source uses profiles, friends, and a synthetic auth.users row for each guest. In Spring Boot, reuse the existing users/`user_profiles` architecture and prefer a non-login guest participant entity with a stable UUID. If existing Split foreign keys require user IDs, design an explicit compatible guest identity subtype and disable all authentication for it; do not create usable guest credentials.
Invariants
1. A user cannot friend themselves.
2. At most one active relationship exists for an unordered pair, regardless of request direction.
3. Only addressee can accept a pending request; either endpoint can delete its own pending/accepted relationship, subject to financial integrity rules.
4. A user may have at most 10 pending plus accepted relationships, counting both directions; enforce atomically at mutation time for both endpoints. Guest relationships count toward this cap unless product explicitly changes the original rule.
5. A user may own at most 5 guest profiles; enforce atomically.
6. Guests are not searchable as real users, cannot receive normal requests, and cannot log in.
7. Only guest owner can edit or retire a guest.
8. Friendship removal cannot erase or orphan historical Split/Group obligations.
3. Lifecycle
Command	Preconditions	Atomic result
Send request	Authenticated real user; distinct eligible real account; no existing pair; both under cap	Create PENDING
Accept	Authenticated addressee; currently PENDING	Change to ACCEPTED
Decline/cancel	Caller is either endpoint of PENDING	Delete row or record tombstone per audit policy
Remove	Caller is endpoint of ACCEPTED; debt policy permits	Delete relationship, preserve financial history
Create guest	Owner authenticated; valid unique guest identity; below guest and relationship caps	Create guest participant and accepted friendship in one transaction
Change guest avatar	Caller owns guest; valid avatar reference	Update guest profile


Repeated or racing commands return deterministic success/no-op or 409 Conflict, as defined by the API, without duplicating relationships.
4. REST API contract (proposed)
All routes are under /api/v1/friends and require bearer JWT. Principal user ID is obtained from the validated security context.
Method	Route	Request	Success
GET	/	Optional cursor, limit	200 grouped relationships + counts
GET	/search	q, optional cursor, limit	200 eligible profiles
POST	/requests	{ "addresseeId": "uuid" }	201 pending friendship
POST	/{friendshipId}/accept	None	200 accepted friendship
DELETE	/{friendshipId}	None	204 if removed
POST	/guests	{ "name": "...", "username": "..." }	201 guest + friendship
PATCH	/guests/{guestId}/avatar	{ "avatarId": "..." }	200 guest profile


Response example (list entry):
{
  "friendshipId": "00000000-0000-0000-0000-000000000001",
  "status": "ACCEPTED",
  "direction": "NONE",
  "person": {
    "id": "00000000-0000-0000-0000-000000000002",
    "displayName": "Alex",
    "username": "alex",
    "avatarId": null,
    "isGuest": false
  },
  "createdAt": "2026-11-17T06:00:00Z"
}
Use INCOMING/`OUTGOING` for pending direction. Never expose guest authentication internals or private contact fields in public search results.
Error semantics
- 400 malformed input; 401 missing/invalid JWT; 403 unauthorized relationship/guest action; 404 unavailable/nonexistent resource (prefer non-disclosing responses); 409 duplicate pair, state race, debt block, cap reached, or username conflict; 422 domain validation; 429 rate limit; 5xx server failure.
- Return stable machine-readable codes, e.g. FRIEND_LIMIT_REACHED, GUEST_LIMIT_REACHED, RELATIONSHIP_EXISTS, REQUEST_NOT_PENDING, OUTSTANDING_SPLIT_OBLIGATIONS, GUEST_NOT_OWNED, USERNAME_TAKEN.
- Include a safe human message and request correlation ID; never include SQL or tokens.
5. PostgreSQL constraints and concurrency
- friendships.id UUID PK; FK requester/addressee to valid participant identities; CHECK (requester_id <> addressee_id); status enum/check; indexed requester_id, addressee_id, status.
- Enforce unordered pair uniqueness using canonical pair columns (LEAST(requester_id, addressee_id) / GREATEST(...)) with a unique expression index or stored canonical columns.
- Protect 10-relationship and 5-guest caps with transactional locking (e.g. lock involved user rows in deterministic UUID order) plus count checks in the same transaction; a plain pre-insert count is race-prone.
- Normalize username case, define uniqueness scope for guests vs real accounts, and enforce with a database unique index as appropriate.
- Create guest and friendship in one @Transactional service method; roll back both if any invariant fails.
- Use Flyway migrations for schema, constraints, and indexes; never rely solely on JPA auto-DDL in production.
- Do not cascade-delete financial history when friendship or guest record changes.
6. Authorization and privacy
Operation	Required authorization
List	Principal is requester or addressee
Search	Authenticated real account; safe profile projection only
Send	Principal is requester; target eligible
Accept	Principal is current pending addressee
Delete	Principal is one endpoint; debt policy enforced
Create guest	Principal is guest owner
Edit guest	Principal equals stored owner


Use Spring Security method/service checks and query scoping. Never accept a requester/owner ID from a request body as authority. Rate-limit search, requests, guest creation, and avatar changes; apply input length/character rules and audit security-relevant mutations. Avoid contact-based account enumeration.
7. Split and group integrity policy
The supplied implementation checks only currently loaded monthly splits in one removal UI, while another removal path bypasses it. This is not acceptable as the final authority.

Recommended policy: block removal if any unsettled direct or group obligation between affected participants exists, regardless of month, and check within a transaction that coordinates with settlement creation/updates. Define the obligation query with the Splits domain owner; it must cover all relevant states, not merely a cached month.

For settled historical records, allow removal but preserve participant snapshots or another immutable lookup that does not depend on current friendship membership. Existing balances must remain visible even after relationship deletion. Guest instant-settlement behavior must be validated by Splits on the server using trusted guest identity, not a client-supplied isGuest flag.

If atomic cross-module checks are not feasible within one database transaction, use a documented consistency protocol and fail closed on removal until the integrity decision is known.
8. Application architecture
Component	Responsibility
FriendsController	REST routes and request validation
FriendshipService	Request/accept/delete lifecycle and caps
GuestService	Guest creation, ownership, avatar mutation
FriendshipRepository	Scoped queries and pair uniqueness
GuestRepository	Owner-scoped guest storage
FriendSearchService	Safe eligibility query, pagination
SplitObligationPolicy	Authoritative outstanding-obligation decision
DTO/mapper layer	Mobile-safe projections, snake/camel adaptation
@ControllerAdvice	Stable error codes and HTTP mapping
Audit/outbox layer	Event publishing and durable mutation audit where required


Integrate with the existing JWT UserPrincipal, security filter chain, PostgreSQL migrations, and user-profile identity rather than introducing a parallel authentication system.
9. Realtime and notifications
- The source relies on Supabase realtime publication. A Spring Boot migration does not automatically preserve that behavior.
- Baseline: consistent REST reads and refresh-on-focus/pull-to-refresh.
- Optional: authenticated WebSocket/SSE or push events for request created/accepted/removed; authorize recipients and never expose unrelated relationships.
- If push is used, store device tokens securely, respect notification permissions, and treat delivery as best-effort; the REST database remains the source of truth.
- For reliable event delivery, prefer a transactional outbox over sending push directly inside the friendship transaction.
10. Validation and tests
1. Reject self-request, guest target, duplicate same-direction and reverse-direction requests.
2. Under concurrency, only one relationship per unordered pair is created.
3. Both endpoints' 10-relationship caps are enforced even with concurrent requests.
4. Only addressee can accept; either endpoint can cancel/reject/remove under policy.
5. Nonparticipants cannot read or mutate relationships, including by guessing UUIDs.
6. Sixth guest fails; concurrent guest creation cannot exceed five.
7. Guest create rolls back fully if accepted friendship cannot be created.
8. Guest avatar update fails for nonowner or invalid avatar.
9. Removing with outstanding obligations fails across all months and group contexts, regardless of client screen.
10. Historical Split records retain readable participant identity after permitted removal.
11. Search excludes caller, guests, related accounts, capped candidates; trim and paginate inputs.
12. Mobile client receives stable codes for 401, 403/404, 409, 429, and validation failures.
13. Logout/revoked JWT cannot access endpoints; authorization is never inferred from client IDs.
14. Integration tests use PostgreSQL/Testcontainers to validate real unique indexes, transactions, and locking.
11. Source alignment and explicit gaps
Supplied Friends document	Spring Boot implementation decision
Angular FriendService signals	React Native shared query/store; backend returns grouped DTOs
Direct Supabase friends insert/delete	Spring Boot transaction-backed REST commands
search_users_for_friendship RPC	GET /search with backend eligibility checks
accept_friend_request RPC	POST /{id}/accept with recipient authorization
create_guest_user RPC	POST /guests atomic participant + relationship creation
Missing update_guest_avatar SQL	Explicit owner-authorized PATCH /guests/{id}/avatar
Realtime table subscription	Optional authenticated event channel; REST refresh baseline
Frontend-only unsettled split check	Backend-authoritative obligation policy
Directed pair unique constraint	Canonical unordered pair unique index
Publicly readable profiles	Minimum-field, scoped search/list DTOs


12. Open product decisions
- Decide whether guests count toward the 10-relationship cap; the supplied source implies yes, and this specification preserves that interpretation.
- Decide whether guest usernames are globally unique or owner-scoped, and whether guest conversion to real accounts is supported.
- Decide whether deleting a guest is allowed, and define retention/archival of historical Split references.
- Define avatar storage and allowed IDs/files, image moderation/size limits if uploads are supported.
- Agree on group-obligation blocking semantics and on push/realtime priority before implementation.
Implementation order: schema and invariants → list/search → request lifecycle → guest lifecycle → Split integrity policy → mobile integration → optional events/notifications → concurrency/security testing.