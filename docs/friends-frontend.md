Friends Module: Frontend Functional & Technical Specification
Platform: React Native (Expo) native mobile application
Status: Proposed implementation contract; derived from the supplied Friends functional document, with mobile-specific additions
Backend target: Expensio Spring Boot REST API (not direct Supabase table writes)
1. Purpose and scope
The Friends module is the participant directory for Splits and group expenses. It supports searching registered users, sending and managing friend requests, accepted friendships, and owner-managed guest participants. It is not a social network or chat feature. The native mobile interface must work with touch interactions, mobile navigation, intermittent connectivity, accessibility settings, and safe retries.
2. Actors and terminology
Term	Definition
Current user	Authenticated Expensio account holder
Requester	Account that sends a pending request
Addressee	Account receiving the request
Accepted friend	Other endpoint of an accepted relationship
Guest friend	Owner-created, non-login participant, accepted for the owner automatically
Friendship ID	Stable ID of the relationship; distinct from user ID
Guest owner	Account authorized to edit its guest participant


3. Screens and user journeys
3.1 Friends home
- Show accepted-friend count and distinct Incoming, Outgoing, and Friends sections, each with counts and empty states.
- Display name, username where available, avatar or fallback initials, and a clearly labeled Guest tag.
- Incoming row: Accept and Decline. Outgoing row: Pending and Cancel. Accepted row: Remove through a confirmation sheet.
- Support pull-to-refresh, skeleton loading, recoverable error with Retry, and accessible list virtualization for large data sets.
- Disable only the row/action in flight; prevent duplicate submissions. After an action, update from authoritative server response and reconcile on refresh.
- Provide a clear Add friend action from the screen and the global add action when the Friends tab is active.
3.2 Add friend bottom sheet
- Two modes: Find user and Create guest; preserve form state only while appropriate, reset sensitive input when dismissed.
- Search by username/display name after at least one non-whitespace character; debounce by 500 ms, cancel or ignore stale requests, trim whitespace, and show no-results/loading/error states.
- Show only eligible non-guest accounts returned by the backend; do not assume client filtering is sufficient.
- Select one result and send request; show explicit success or conflict/limit feedback.
- Handle keyboard avoiding behavior, safe-area insets, focus management, Android back gesture, and screen-reader labels.
3.3 Create guest
- Require a display name and username, with inline validation and server-side uniqueness/error feedback.
- Explain that a guest is a participant record, not a separate login-enabled account.
- After successful creation, insert the guest into the accepted list and make it selectable in Splits.
- Clearly show the five-guests-per-owner limit, including the remaining count when available.
- Allow guest avatar changes through a discoverable Edit guest action; optional long-press may also open it, but long-press must not be the only route.
- Avatar selector must use an approved preset list or native image picker with permission handling and upload constraints, depending on the final avatar product decision.
3.4 Remove, decline, and cancel
- Use a confirmation dialog for accepted-friend removal, naming the person and explaining the impact on future Splits.
- Declining/cancelling may use a lighter confirmation or undo only if backend semantics support it.
- Never rely on currently loaded monthly split records to decide whether removal is permitted. Request backend preflight information if offered and always honor the backend's final decision.
- If unsettled split/group obligations block removal, show the server-provided actionable explanation and a link to the relevant Splits area.
4. Frontend state and lifecycle
State	Content
acceptedFriends	Accepted relationships with resolved counterpart profile
incomingRequests	Pending relationships where current user is addressee
outgoingRequests	Pending relationships where current user is requester
searchResults	Server-approved eligible accounts for current search
loading / refreshing / pendingActionIds	Independent fetch, refresh, and row-action status
error	Recoverable, user-readable error mapped from API


- Fetch on entering Friends, after authentication changes, and on explicit refresh.
- Use a shared Friends store/query cache so Splits, Groups, and Dashboard see the same accepted participant directory.
- Invalidate and refresh lists after mutations; subscribe to authenticated real-time events only if the backend provides them, otherwise refresh on focus/pull and optionally poll while visible.
- Clear private cached data, subscriptions, and in-flight requests on logout/account switch.
- Persist only the minimum necessary non-sensitive cache; display cached data as potentially stale when offline. Never queue an irreversible remove or accept action silently.
5. Suggested React Native architecture
Layer	Responsibility
FriendsScreen	Sectioned list, counters, refresh, entry actions
FriendRow	Avatar, guest badge, request status, row actions
FriendSheet	Search/create guest modes and form handling
FriendRemovalSheet	Confirmation and server-side debt-block explanation
GuestEditorSheet	Owner-authorized avatar edit
friendsApi	Typed calls, auth headers, error normalization
useFriends / Friends store	Shared query cache, partitioning, invalidation
Auth/session layer	Current account, JWT lifecycle, logout cleanup
Splits/Groups integrations	Participant selection, identity display, settlement rules


Navigation is through the app's Friends tab/route; bottom sheets should respect device safe areas and Android hardware back.
6. REST API consumption contract
The endpoint names below are proposed Spring Boot replacements for the supplied Angular/Supabase RPC and direct-table flows; they are not claims of existing implemented APIs.
Action	Method and route	UI result
List relationships	GET /api/v1/friends	Accepted, incoming, outgoing lists/counts
Search candidates	GET /api/v1/friends/search?q=...	Eligible non-guest profiles
Send request	POST /api/v1/friends/requests	Pending friendship
Accept request	POST /api/v1/friends/{friendshipId}/accept	Accepted friendship
Decline/cancel/remove	DELETE /api/v1/friends/{friendshipId}	Deleted relationship or domain conflict
Create guest	POST /api/v1/friends/guests	Guest profile + accepted friendship
Update guest avatar	PATCH /api/v1/friends/guests/{guestId}/avatar	Updated profile


All calls require authenticated requests; identity is derived from the JWT, never from a user ID supplied by the client. Use stable friendship IDs for relationship actions and user IDs for Split participant references. Paginate search and list endpoints when scale requires it.
7. Native mobile requirements
- Network: timeout, retry only safe reads automatically, distinguish offline/timeout/401/403/404/409/429/5xx, show Retry.
- Security: use secure token storage; do not log JWTs, private profile data, or guest details; no privileged Supabase keys in the app.
- Accessibility: 44–48 dp minimum touch targets, meaningful labels, dynamic type, contrast, voice-over/talkback, no gesture-only essential action.
- Keyboard and sheets: focus trapping/restoration, keyboard avoidance, safe-area handling, Android back dismissal.
- Notifications: optional push/deep link for incoming requests, requiring backend notification support and consent; in-app refresh must work without push.
- Privacy: search returns minimum profile fields; avoid exposing phone/email unless explicitly authorized.
- Consistency: handle concurrent accept/remove and expired requests gracefully; server state is authoritative.
- Performance: debounce search, cancel stale responses, list virtualization, cache avatar images with fallback.
8. Cross-module dependencies
Consumer	Requirement
Splits creation	Only accepted friends and owner guests selectable; group splits restrict selection to group members
Split balances/history	Use immutable participant IDs; display server-provided participant snapshot/fallback when relationship no longer exists
Split settlements	Guest counterparty may use immediate settlement only if server enforces the guest policy
Group creation/edit	Accepted friends are candidates; server validates membership and unsettled debt constraints
Dashboard	Friend balance summaries must not silently hide outstanding balances after removal
Authentication	Login/logout switches data and event subscriptions safely


Friends owns relationships and participant discovery, not financial balances or settlement records.
9. Acceptance criteria
1. User sees only their accepted/incoming/outgoing relationships with correct counts.
2. Search waits 500 ms after input, ignores stale responses, and excludes self, guests, existing relationships, and ineligible capped accounts.
3. Request, accept, decline, cancel, and remove update the correct sections and provide feedback.
4. Guest creation requires both fields, respects the five-guest limit, and produces an accepted participant.
5. Only the guest owner can edit the avatar; edit action is accessible without long-press.
6. Relationship limits and unpaid-debt restrictions show meaningful server errors.
7. Offline and network failure states never falsely report a completed mutation.
8. Split and group participant pickers immediately reflect refreshed accepted friends.
9. Removed friends remain identifiable in historical financial records.
10. Android/iOS keyboard, safe-area, back gesture, screen-reader, and logout scenarios pass testing.
10. Implementation gaps and decisions
- Source gap: uploaded document describes Angular signals and direct Supabase access; this spec deliberately maps them to React Native state and Spring Boot REST.
- Source gap: no working backend definition of update_guest_avatar was provided; implement before enabling the edit UI.
- Source risk: removal protection based on currently loaded splits is incomplete; require backend-wide debt checks.
- Product decision: whether to allow removal despite historical settled splits; recommended: preserve history via participant snapshots.
- Product decision: whether guest avatars are presets or uploaded photos; define storage and permissions accordingly.
- Product decision: push notifications and realtime are enhancements, not assumed infrastructure.