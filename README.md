# Ledgerly

**Your bank SMS, turned into a clean expense log.**

Ledgerly is an Android app that reads bank and UPI SMS **on the phone**, turns them into transactions, pre-sorts them into categories you have used before, and asks you to review them once. It is built for India: ₹ amounts with lakh grouping, UPI payees, and payments to people (auto/cab drivers, landlords) that need a note.

> Only the extracted amount, payee, date, category and note are saved to your account. The SMS text is never uploaded.

## Features

- **SMS parser** (pure TypeScript, unit tested): separates real payments from OTPs, promos, recharge offers, failed or pending payments and bill reminders, then extracts amount, debit/credit, payee, bank reference and time.
- **Inbox review flow**: new payments land as *pending*. Debits arrive pre-categorised when the payee is known (your own rules, your past choices, or well-known brands like Zomato or Uber). One *Review & Confirm* screen lets you fix anything and confirm a batch.
- **Payments to people**: asks "what was this for?" and groups them by your note ("Rapido ride") with the drivers' names underneath.
- **Home**: monthly spend, change vs last month, daily average, category split, and a category → payee → payment drill-down.
- **Transactions**: search, month and category filters, day groups with subtotals, edit or move a payment back to the Inbox.
- **Rules and custom categories**: "always put this payee in this category", plus your own categories.
- **Notifications**: a background check about every 15 minutes for new SMS, a batched alert, an optional daily reminder, and lock-screen details hidden by default.
- **Accounts**: email + password with a one-time email code to verify sign-up, and password reset by code.
- **UI**: Inter, Material-3 style tokens, light theme, a swipeable tab pager.

## Tech stack

| Area | Choice |
|---|---|
| App | Expo SDK 57, React Native 0.86 (New Architecture), TypeScript |
| Navigation | Expo Router, `react-native-pager-view` for the tabs |
| Styling | NativeWind (Tailwind) with the design's colour tokens |
| Server state / UI state | TanStack Query / Zustand |
| Validation | Zod |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| SMS access | `react-native-get-sms-android` (patched, see below) |
| Tests | Jest |

## Project structure

```
app/                  Expo Router routes (auth, tabs shell, settings, SMS permission)
src/
  parser/             SMS classifier and field extractors (no UI dependencies) + tests
  screens/            Home, Inbox, Transactions, Rules
  components/         Payment card, Review & Confirm modal
  navigation/         TabsShell (pager + bottom bar)
  data/               Supabase queries, hooks, pure row/batch builders + tests
  reports/            Monthly breakdown (category → payee → payments) + tests
  notifications/      Message builder, settings, notify helpers + tests
  background/         Periodic "check for new payments" task
  sms/                Inbox reader and scan/import
  ui/                 Design tokens, shared components
supabase/migrations/  SQL schema, in order
patches/              patch-package fix for the SMS library
docs/                 Setup guides and the design export
```

## Getting started

### Prerequisites
- Node 20+ and npm
- JDK **17** (Gradle 9 does not run on newer JDKs for this project) and the Android SDK
- An Android phone with USB debugging, or an emulator
- A Supabase project

### 1. Install
```bash
npm install        # also applies patches/ via patch-package
```

### 2. Configure Supabase
1. Create a project and copy the **Project URL** and the **publishable (anon) key**.
2. Copy `.env.example` to `.env.local` and fill both values. Never use the `service_role` key in the app.
3. In the SQL editor, run these in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_note_and_payee.sql`
   - `supabase/migrations/0003_categories.sql`
4. Set up email codes: see [`docs/email-otp-setup.md`](docs/email-otp-setup.md) (custom SMTP, "Confirm email" on, templates that show `{{ .Token }}`).

### 3. Run on a device
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
npx expo run:android          # first build takes a while
```
After the first install, `npx expo start --dev-client` is enough for JS changes. If the phone cannot reach Metro:
```bash
adb reverse tcp:8081 tcp:8081
```

### Tests and type check
```bash
npm test
npm run typecheck
```

## Build a standalone APK
```bash
npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```
Bump `version` and `android.versionCode` in `app.json` for every release so installs update in place. The release APK is currently signed with the debug key, which is fine for sharing with testers but not for the Play Store.

## Notes

- **SMS library patch**: `react-native-get-sms-android` has not been updated since 2022 and fails on Gradle 9. `patches/react-native-get-sms-android+2.1.0.patch` fixes its `build.gradle`; it is re-applied on every `npm install`.
- **Row Level Security**: every table is private per user (`auth.uid() = user_id`). The app only ever uses the publishable key.
- **Email limits**: custom SMTP through a Gmail account is fine for early testers (about 500 emails/day). Move to a domain and a service like Resend for real traffic.
- **Play Store**: needs your own signing key, an `.aab`, a privacy policy and Google's SMS-permission declaration.

## Roadmap ideas
Export (CSV), crash reporting, in-app feedback, a proper release signing key, phone-number OTP.

## License
See [LICENSE](LICENSE).
