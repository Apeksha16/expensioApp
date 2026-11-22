# Splits Module — Backend Functionality

## Purpose

The backend supports shared expenses, participant shares, balances, groups, and payment tracking for the Splits module. This document describes the capabilities and business rules it needs to provide.

## Users, participants, and access

- Support signed-in users, friends, group members, invited contacts, and guests as participants in shared expenses.
- Allow expenses to include a guest or invited contact who has not joined the app.
- Keep participant identity and access scoped to the relevant user, expense, group, or payment.
- Enforce permissions for expense changes, share review, comments, group management, payment actions, forgiveness, and corrections.
- Prevent users from viewing or changing records they are not permitted to access.
- Support blocking or removal where applicable without deleting required financial history.

## Shared expenses and shares

The backend accepts and maintains shared expenses with a title, total amount, date, payer, participants, individual shares, and optional group, category, note, and receipt.

Supported share methods are equal, exact amount, percentage, and relative shares. For every expense:

- The total must be positive and expressed in INR minor units (paise).
- Shares must add up exactly to the total. Any remainder from an equal or proportional division must be assigned consistently so the final shares reconcile.
- A participant must not appear more than once, and the payer and participants must be valid for the expense.
- The expense retains a clear relationship between the amount paid and each participant's personal share.

Authorized users can create and edit eligible expenses. Changes to an expense or its shares update the affected outstanding balances. Where payment history prevents a direct edit, the backend supports an auditable correction such as voiding and recreating the expense. Voided expenses and prior versions remain identifiable in the history.

Participants can acknowledge a share, flag it for review, or respond to a request for approval when required. The expense owner can view and respond to flags. Comments, mentions, and reports are associated with their expense or group and follow the applicable access rules.

## Balances

The backend provides all-time balances and balance views by person and group. It also provides expense and payment details that explain how each balance was formed.

- A balance distinguishes confirmed outstanding amounts from pending, disputed, or otherwise unconfirmed payments.
- A pending payment request does not reduce confirmed outstanding debt.
- Period filters affect the requested activity or expense summary only; they do not change all-time balances.
- Balances remain consistent when viewed from the person, group, expense, and payment contexts.
- The backend identifies when balance information was calculated so the client can communicate freshness.
- A balance is never reported as zero merely because it could not be retrieved.

Group debt simplification may return suggested payments as a preview. It does not alter expenses, payment records, or balances.

## Data changes and update frequency

- Treat confirmed financial history as durable. Do not silently overwrite or delete an expense, share, confirmed payment, forgiveness, or reversal. Corrections remain linked to the original action and visible in history.
- Allow ordinary edits to expense details and group settings where permitted. Keep user preferences such as notification choices changeable without creating financial-history entries.
- Recalculate or return affected balances as part of completing a financial change, so a successful response is followed by consistent expense, person, group, and request views.
- Balance totals are derived from expenses and payment state. Do not require a separate user action to maintain totals, or expose a balance that disagrees with its underlying history.
- Update only the people, groups, balances, requests, and activity affected by a change. Unrelated records must remain unchanged.
- Persist drafts only when the user chooses to save one. Do not create server-side expense or payment records from incomplete form input.
- Repeated delivery or retry of the same submitted user action must not create duplicate financial records. If the result of a submission is uncertain, the client must be able to retrieve its final status.

## Request responsiveness and background work

Requests that open the module or let a user act on money have the highest responsiveness priority. This includes the balance summary, requests awaiting the current user, person/group balances, expense and payment details, and submitting or confirming a financial action. These responses should normally complete within 500 ms at the 95th percentile under expected operating load; financial writes may take up to 1 second. If a request cannot finish promptly, the client must receive a clear pending result or error rather than wait indefinitely.

Activity pages, search, filters, group membership lists, and older history should remain responsive but may take longer than the balance summary. They should return only the requested content and support incremental retrieval so opening a long history does not require loading it all at once.

Work that does not need to delay the user's successful action may run in the background. Examples include sending notifications, reminders, invitation messages, updating activity feeds, and processing uploaded receipt or proof files. The backend must still expose the outcome or current status when it affects what the user sees. Expiration of payment requests and invitation links must take effect without requiring the user to open the related screen.

The response that completes a financial action must make its accepted status and resulting balance state clear. Notification delivery or other nonessential follow-up work must not delay that response. For background work that fails, preserve the financial result and make the follow-up eligible for retry without duplicating its user-visible effect.

## Groups and membership

Users can create, view, update, archive, and restore groups. Groups have a name, creator, members, and optional image or purpose. Group roles include owner, admin, and member, with different permissions for group and membership management.

The backend supports invitations, invitation status, joining, leaving, member removal, and group archival. Leaving or removing a member does not erase their existing expenses or obligations. When a member leaves with an outstanding balance, that balance remains available outside the group membership view.

## Payments and settlement lifecycle

The backend records full or partial payments between two parties and associates each payment with the debts it addresses. Supported payment methods include UPI, cash, bank transfer, and other.

Payment requests follow these rules:

- The person who owes can record a payment and request confirmation from the person owed.
- The recipient can confirm or dispute a request. The requester can cancel an eligible request.
- A payment affects confirmed outstanding balances only when it reaches a confirmed state.
- A payment cannot exceed the remaining eligible debt. Multiple requests against the same debt cannot collectively reserve more than is available.
- Repeated submissions of the same user action must not create duplicate expenses or payments.
- Requests have a configurable response period. Expired requests no longer reserve debt and do not count as confirmed payments.
- A person owed money can record money received. Such a record is identified as recorded by the creditor; for a guest who cannot confirm, it remains unverified.
- Users can settle opposing debts together where permitted, forgive an amount owed to them, and reverse or correct an eligible confirmed payment. The history shows the original action and its correction.
- Disputed payments remain visible, and their resolution follows the permissions of the involved parties.

Payment proof may be attached to a payment. The backend makes the proof available only to authorized participants and applies the module's attachment limits and privacy requirements.

## Activity and history

The backend provides a chronological activity history for expenses, payment requests and outcomes, share acknowledgements, comments, group changes, invitations, and corrections. History identifies the relevant action and actor while preserving prior financial states. Users can retrieve activity by date, group, person, category, and status.

## Invitations and identity linking

The backend supports invitations by contact details and group invitation links. It tracks whether an invitation is sent, opened, accepted, expired, or revoked. Guest or invited-contact records can be linked to a registered account only through the required consent and verification steps. Linking identities must preserve existing expense and payment history.

## Notifications and client updates

The backend supplies notifications for relevant expense, share, payment, reminder, invitation, and group events. Notification delivery respects each user's preferences, quiet hours, privacy setting, and eligibility to see the underlying record. Notification content must not expose sensitive expense details when the user has chosen to hide them.

The backend supports clients refreshing data after changes and receiving enough information to recognize current record state. Changes to payment requests, confirmations, disputes, or balances must reach active clients viewing the affected Splits data promptly. Changes to shares, group membership, or comments must likewise be visible to participants viewing that expense or group. Historical lists and inactive screens do not require continuous updates; they must reflect the latest state when requested again.

## Connection to other money features

When a split expense affects a user's broader expense history, expose the amount they paid separately from their personal consumption share. A repayment is not income. This allows other money features to represent cash movement and personal spending accurately.

## Privacy, retention, and account changes

- Protect contact details, receipts, payment proof, and financial records from unauthorized access.
- Do not expose private contact information to other participants unless the user has permitted it.
- On account deletion, remove or anonymize personal identifiers as required while retaining financial records needed to preserve other participants' histories.
- Support authorized export of a user's split information when export is available.
- Apply retention rules to financial and invitation data.

## Initial release boundaries

The initial release supports INR, one payer per expense, the four share methods listed above, manual payment recording, and non-mutating debt simplification suggestions. It does not include recurring expenses, multiple payers, itemized tax/tip/discount allocation, foreign-currency conversion, automatic payment-provider reconciliation, or offline submission of financial changes.

## Later capabilities

Potential later additions include recurring expenses, templates, multiple payers, itemized expenses, per-group currencies, guest identity claims, payment-provider reconciliation, CSV/PDF exports, and integrations that initiate payments.
