# Splits Module — Frontend Functionality

## Purpose

The Splits module lets users record shared expenses, understand balances between people, and keep track of payments. This document describes the user-facing functionality the app needs to provide.

## Main areas

The module provides access to:

- **Activity:** shared expenses, payments, and other split-related changes.
- **Groups:** shared groups, their members, expenses, and balances.
- **People:** each person's balance with the signed-in user.
- **Requests:** payments awaiting action, shares awaiting review, and disputed items.

Users can search and filter their split activity by date, group, person, category, status, and payer. Applying a period filter to activity must not change all-time balances.

## Balances

- Show the user's net balance, the total others owe them, and the total they owe others.
- Distinguish confirmed outstanding amounts from pending payment requests. Pending amounts must not appear as paid or reduce confirmed debt.
- Make the balance scope clear: all time, a selected group, or a selected period.
- Let the user open a person or group balance and see the expenses and payments that contribute to it.
- Show an unavailable or stale state when current balances cannot be loaded; do not present a failed load as a zero balance.
- When all balances are settled, communicate that clearly.

## Data freshness, loading, and requests

- Load the balance summary and the selected content independently. A slow activity list must not hold back the balance summary, and a balance failure must not hide the rest of the screen.
- On the first load, show placeholders shaped like the balance summary and the rows being loaded. On refresh, keep existing content visible and show a small refresh indicator. Use a local loading state for actions on a single row or sheet rather than blocking the whole screen.
- Keep the last successfully loaded values visible during refresh. If refresh fails, label those values as stale and offer retry. If there is no cached value, show an unavailable state instead of a fabricated empty list or zero balance.
- Load more activity as the user reaches the end of the list. Keep already loaded rows visible while the next page loads; show a retry option if that page fails.
- Refresh balances, requests, and the current activity view when the app returns to the foreground, after a relevant action succeeds, and when the user explicitly refreshes. Keep historical views and inactive screens out of continuous refresh; refresh them when opened or explicitly requested.
- While the user is in the Splits module, update active payment requests, confirmations, disputes, and the balances they affect as soon as another participant changes them. Refresh an open split or group when a participant changes its shares, membership, or comments.
- Activity history, search results, filters, and older pages do not need continuous updates. Refresh them on entry, explicit refresh, or after an action that affects them.
- Search and filter selections should respond immediately in the UI. Search results may load after a short pause in typing; changing filters should fetch only the matching content. Changing a filter must not trigger a balance change.

## When changes appear and when requests run

- Keep form edits, participant selection, split previews, and other unsaved input local to the screen. Do not save an expense or payment until the user explicitly submits it.
- Show split shares immediately as the user changes the total, method, or participants. Before saving, accept the server's validated result as authoritative and present any changed allocation clearly.
- Financial actions such as creating or editing an expense, recording or confirming a payment, disputing, forgiving, or reversing must show a submitting state and wait for the server's result before showing them as successful or changing confirmed balances. On failure, keep the user's input where possible and explain how to retry or resolve the conflict.
- Do not optimistically mark a payment confirmed or reduce a confirmed balance. A submitted payment can appear in Requests as pending only after the server accepts it.
- Low-risk preferences, such as notification choices or a local display preference, may update immediately in the UI and save in the background. If saving fails, restore the prior value or show a clear unsaved state.
- For comments, invitations, group changes, and other submitted actions, show a local progress state and report success only after acceptance. Refresh affected screens after success. Never hide an error behind a background retry.
- Background refreshes must not interrupt typing, close a sheet, reset scroll position, or discard a draft. A failed background refresh leaves existing content intact and indicates that it may be stale.

## People and participants

Users can add friends, group members, invited contacts, and guests to a split. A participant does not need an account for the split to be recorded. Guests and invited contacts must be clearly identified, and payments involving them must show whether they have been verified.

Users can find and select participants, add a guest by name, invite a contact, and remove or block a person where permitted. Contact access is optional; manual entry must remain available if access is denied.

## Shared expenses

Users can create a split with a title, amount, date, payer, participants, optional group, category, note, and receipt. The signed-in user can be the payer or a participant who owes a share.

The supported ways to divide an expense are:

- Equally among participants.
- By exact amounts.
- By percentages.
- By relative shares.

Show each participant's share before saving. The shares must add up to the expense total, including any paise remainder. Amounts use INR and paise precision.

Users can save a draft, edit an eligible split, and view its details. Editing must show the effect on participant shares and balances. When a split can no longer be edited because of its payment history, explain the available correction action. Voiding or correcting an expense must preserve its history rather than silently erasing it.

## Split details and collaboration

For each split, users can see the payer, participants, each person's share, payment and review status, notes, receipt, and change history. Eligible participants can acknowledge or flag their share, add comments, and report inappropriate content. Users can share a split or group using the available sharing options without exposing private information unintentionally.

## Groups

Users can create groups, name them, add members, and optionally choose an image or purpose. Group pages show members, activity, shared expenses, and each member's balance.

Group owners and admins can manage membership and invitations according to their role. Users can mute group notifications, archive and restore groups, and leave a group when allowed. A group with unresolved balances may be left, but those balances remain available in the user's People view. Users can preview suggested payments that simplify group debts; the suggestion does not change balances until payments are recorded.

## Payments and settling up

Users can record a full or partial payment against an amount they owe, or record money they received. A payment request remains pending until the other party confirms it. The recipient can confirm or dispute a request; the sender can cancel an eligible request. The app must show who needs to act next and the amount affected.

Users can settle opposing balances together when available, record cash or other payment methods, send a reminder, forgive an amount they are owed, or correct a recorded payment through the allowed reversal flow. A dispute or correction must be visible in the payment history. Payments involving guests are shown as unverified when the guest cannot confirm them.

## Notifications and updates

Users receive relevant notices about new expenses, share reviews, payment requests, confirmations, disputes, reminders, group invitations, and membership changes. A notification opens the related item and refreshes its current state. Users can choose which categories to receive and whether notification details are hidden.

The app requests notification permission when needed and continues to provide an in-app Requests and notification view when permission is declined.

## Offline and interrupted use

Users can view previously loaded information while offline and see when it was last updated. They can prepare and keep drafts offline. Actions that require a connection must clearly indicate when they cannot be completed. If a save is interrupted, the app must make it clear whether the action succeeded and avoid creating duplicate expenses or payments when the user retries.

## Privacy and accessibility

Users can hide sensitive amounts, protect access to the app with available device security, and control contact, camera, photo, and notification permissions. Denying an optional permission must not prevent manual expense or participant entry.

The module must support screen readers, text resizing, clear status labels, and accessible controls. Amount meaning must be understandable without relying on colour alone. Dates and amounts must use the user's supported locale settings.

## Out of scope for the initial release

- Recurring expenses and expense templates.
- Multiple payers for one expense.
- Itemized expenses with tax, tip, and discount allocation.
- Foreign currency and exchange-rate calculations.
- Claiming or linking a guest identity without the required approvals.
- Automatic payment-provider reconciliation or initiating UPI payments.
- Queuing financial changes for submission while offline.
- CSV/PDF exports, widgets, and share extensions.
