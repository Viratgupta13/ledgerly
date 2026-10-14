# Expensefy — UI design brief (for Google Stitch)

How to use: paste **Part 1** first so Stitch knows the product and style. Then paste **one screen from Part 2 at a time** (Stitch gives better results screen by screen). Ask it to keep the same style for every screen.

---

## Part 1 — Master prompt (paste this first)

Design a mobile app called **Expensefy**: an Android expense tracker for people in India. It reads bank and UPI SMS on the phone, turns them into transactions automatically, and asks the user to quickly review and categorise them. The goal of the whole design is **minimum effort for the user**: most payments should already be sorted, and the user only glances, fixes mistakes, and confirms.

**Platform:** Android phone, portrait, 360×800 dp. Material-3-style, thumb-friendly. Bottom tab bar with 4 tabs. Every tappable element is at least 48dp tall.

**Style:** modern fintech, calm, trustworthy, friendly (think CRED / Walnut / Google Pay, but lighter). Generous spacing, rounded cards (16–24dp radius), large readable numbers, one strong accent colour (currently indigo, but you may propose a better one), soft shadows or thin borders. Provide **both light and dark** versions.

**Currency and formats:** Indian Rupees with Indian digit grouping, e.g. ₹1,25,000.00. Dates like "14 Oct". Money going out (debit) is red/rose with a minus sign; money coming in (credit) is green with a plus sign.

**Categories** each have their own fixed colour dot: Food, Transport, Shopping, Bills, Rent, Friends, Other, Essential (users can add their own).

**Realistic sample data to use in mockups:** Blinkit ₹349.00, Zomato ₹612.50, Swiggy Instamart ₹240.00, Rapido ride (paid to a driver named "Rinku Singh") ₹80.00, Uber ₹215.00, Amazon ₹1,499.00, Jio ₹299.00, Rent to "Ramesh Kumar" ₹15,000.00, salary credit ₹52,000.00.

**Core concepts the design must express clearly:**
1. **Pending** payments live in the Inbox until the user confirms them.
2. **Pre-sorted:** if the app already knows the category (learned from the user's past choices or a well-known brand like Zomato), it is shown filled in, and the user only checks it.
3. **Payments to a person** (e.g. an auto/cab driver's QR) need a short note ("Rapido ride") because the bank SMS only shows a name.
4. **Privacy:** SMS are read and processed on the phone; only the extracted amount, payee, date, category and note are saved. Show this reassurance in the sign-up screen and the SMS-permission screen.

**Navigation (bottom tabs):** Home · Inbox · Transactions · Rules. Auth screens have no tabs.

---

## Part 2 — Screens (paste one at a time)

### Screen 1 — Sign in
- App logo (a rupee mark in a rounded square), name "Expensefy", one-line tagline: "Your bank SMS, turned into a clean expense log."
- Fields: **Email**, **Password** (with show/hide eye).
- Primary button: **Sign in**.
- Text link: "New here? Create an account".
- States to show: default, loading (button shows spinner), error (red text under the fields, e.g. "Invalid login credentials").

### Screen 2 — Create account
- Same layout as Sign in. Fields: **Email**, **Password** (helper text: "At least 6 characters").
- Primary button: **Create account**.
- Link: "Have an account? Sign in".
- A small privacy note with a lock icon: "Your SMS never leave your phone."
- States: default, loading, error, and success message "Check your email to confirm your account."

### Screen 3 — SMS permission (a new, friendly pre-permission screen, shown once before the Android system dialog)
- Illustration or icon of a message turning into a receipt.
- Title: "Let Expensefy read your bank SMS".
- 3 short bullets: "We only look for payment messages", "OTPs and promos are ignored", "Nothing but the amount, payee and date is saved".
- Primary button: **Allow SMS access**. Secondary link: "Not now".

### Screen 4 — Home (tab 1)
Purpose: how much did I spend, and on what.
- Top: large title "Home".
- **Month switcher:** left arrow, "October 2026", right arrow (48dp tap areas). A small pill toggle: **Show all time / Show by month**.
- **Hero card** (accent colour): label "Spent in October", very large total "₹18,420.50".
- **Category cards**, one per category, sorted by amount, each showing: colour dot, category name, "N payments", amount, a thin **share bar** (percentage of total), and a chevron. Tapping expands the card.
- **Expanded category:** list of **payee rows** (e.g. "Blinkit · ₹3,400.00 · 12x", "Zomato · ₹900.00 · 5x"). Tapping a payee row expands it again to the **individual payments** (date, amount; for person payments also the person's name and the note, e.g. "Rinku Singh · Rapido ride · 12 Oct").
- For person payments, payees are grouped by the note: "Rapido ride ₹140 · 2x" expands to the drivers' names.
- Empty state: pie-chart icon, "No spending to show", hint "Confirm payments in the Inbox to see them here."
- Optional idea: a small donut or bar chart of category split under the hero card.

### Screen 5 — Inbox (tab 2): list
Purpose: review new payments found in SMS.
- Title "Inbox", subtitle "38 to review". Tab shows a numeric badge.
- **Scan card:** three range chips (**30 days / 90 days / 1 year**, one selected), and a primary button **Scan SMS** (with a scan icon). After scanning, a result line: "Read 471 SMS, found 93 payments, 12 new."
- **Review button** (secondary, prominent, only when pre-sorted payments exist): **Review & confirm 24 pre-sorted**.
- **List of payment cards** (below). Empty state: check-circle icon, "All caught up", "Scan your SMS to find new payments."

### Screen 6 — Inbox payment card (collapsed, expanded, credit, person variants)
Show these variants side by side:
1. **Collapsed debit, pre-sorted:** payee "BLINKIT", "14 Oct, 6:42 pm", amount "-₹349.00" in red, a coloured dot + "Food" and a small chevron-down.
2. **Collapsed debit, needs category:** same but the line reads "Needs a category" in amber.
3. **Expanded debit:** divider, then a wrapping row of **category chips** (each with its colour dot; selected = filled accent), including a dashed **+ New** chip; a row of **recent-note chips** ("Rapido ride", "Rent"); a **Note** text field with placeholder "Note (e.g. Rapido ride)"; a row "Always use Food for BLINKIT" with a switch; then two buttons: **Confirm** (primary) and **Ignore** (secondary).
4. **Person payment:** same as expanded, plus an amber hint "Paid to a person. What was this for?" above the chips; the "Always use" switch is off by default.
5. **Credit:** green "+₹52,000.00", no category or note, always open with just **Confirm** and **Ignore**.
6. **Add category inline:** after tapping "+ New", a text field "New category name" and an **Add** button appear under the chips.

### Screen 7 — "Review & confirm" popup (full-screen modal)
Purpose: one last look at everything that is already sorted, then confirm in one tap.
- Header: "Confirm 24 payments", subtitle "₹6,420.00 in total. Check the sorting, fix anything wrong, then confirm."
- Scrollable list of **category sections** (card each): colour dot, category name, "12 payments · 3 payees", section total.
- Inside each section, **one row per payee**: payee name, "5 payments · tap to see each", total amount, and two small text actions: **Change category (all)** and **Remove all** (red). Single-payment payees say "Change category" and "Remove".
- Tapping a payee row expands the **individual payments** (date, amount) each with their own **Change category** and **Remove**.
- Tapping Change category opens a wrapping row of category chips under that row; picking one moves the payment(s) to that category's section.
- Sticky bottom bar: **Confirm 24** (primary) and **Cancel** (secondary). When everything is removed the primary button is disabled.
- Show the state with one payee expanded and one chip picker open.

### Screen 8 — Transactions (tab 3)
Purpose: the history of confirmed payments, editable.
- Title "Transactions", subtitle "Tap a payment to change its category or note".
- List of rows/cards: payee name, line "● Food · Rapido ride · 12 Oct" (dot + category + note + date), amount on the right (red or green).
- Tapping a debit opens an **inline editor** in place of the row: category chips + "+ New", recent-note chips, note field, "Always use … for …" switch, **Save** and **Cancel**.
- Empty state: receipt icon, "Nothing confirmed yet", "Confirmed payments show up here."
- Optional: a search field and filter chips (All / Debits / Credits / by category) at the top.

### Screen 9 — Rules (tab 4)
Purpose: payees that always go to the same category.
- Title "Rules", subtitle "Payees you always put in the same category".
- Rows: payee key (e.g. "blinkit"), colour dot + category, and a red text action **Delete**.
- Empty state: funnel icon, "No rules yet", hint "Turn on “Always use…” while confirming a payment."

### Screen 10 — Settings / Profile (new, not built yet)
- Account section: email, **Sign out** button.
- "Scan automatically when the app opens" switch.
- Default scan range chips (30 days / 90 days / 1 year).
- Categories: list of the user's own categories with delete.
- Privacy section: "SMS are processed on your phone. Only amount, payee, date, category and note are saved."
- App version.
- This could be a 5th tab or an avatar button in the Home header; propose which is better.

### Screen 11 — Onboarding (optional, first launch)
Three swipeable slides: (1) "We read your bank SMS" (2) "Most payments are sorted for you" (3) "Review once, done". Dots indicator, **Next / Get started**, and **Skip**.

---

## Part 3 — Reusable components to define once
- Primary / secondary / danger buttons (48dp, pressed state dims).
- Category chip (default, selected, dashed "+ New", with colour dot).
- Text link action (small, blue/accent, 36dp+ tap area).
- Input field (48dp).
- Card (rounded, border or soft shadow).
- Amount text (red with "-", green with "+").
- Empty state (icon, title, hint).
- Bottom tab bar (4 tabs, active state, optional badge on Inbox).
- Switch row, progress/share bar, modal header + sticky action bar.

## Part 4 — Things to ask Stitch for at the end
- A dark-mode version of every screen.
- A short style guide: colours (with hex), type scale, spacing, radius.
- Two alternative accent colours so I can compare.
