# Email OTP setup (Supabase + Gmail)

The app sends a code to the user's email on sign-up and on "Forgot password". This needs three things in Supabase. No domain is required.

## 1. A Gmail account just for sending
1. Create a new Gmail, e.g. `ledgerly.noreply@gmail.com` (do not use your personal one).
2. Turn on **2-Step Verification**: Google Account → Security → 2-Step Verification.
3. Create an **App password**: Google Account → Security → App passwords → name it "Ledgerly" → copy the 16-character password (shown once).

## 2. Custom SMTP in Supabase
Supabase dashboard → **Authentication → Emails → SMTP Settings** (or Project Settings → Authentication → SMTP) → turn on **Enable custom SMTP**:

| Field | Value |
|---|---|
| Sender email | the Gmail address |
| Sender name | Ledgerly |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | the Gmail address |
| Password | the 16-character App password |

Save. (Gmail allows about 500 emails per day, plenty to start. Move to a domain + Resend later.)

## 3. Turn on email confirmation
**Authentication → Sign In / Providers → Email** → turn **Confirm email** ON.

## 4. Make the emails carry the code
**Authentication → Emails → Templates**. Edit two templates and replace the body so it shows `{{ .Token }}` (the code), not a link.

**Confirm signup** — subject `Your Ledgerly verification code`:
```html
<h2>Verify your email</h2>
<p>Your Ledgerly code is:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">{{ .Token }}</p>
<p>It expires in one hour. If you did not sign up, ignore this email.</p>
```

**Reset password** — subject `Your Ledgerly password reset code`:
```html
<h2>Reset your password</h2>
<p>Your Ledgerly reset code is:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">{{ .Token }}</p>
<p>It expires in one hour. If you did not ask for this, ignore this email.</p>
```

## 5. Check the code length
**Authentication → Sign In / Providers → Email** → "Email OTP Length" should be **6** (default).

## Test
1. Open the app → Create an account with a real email → a code arrives → enter it → you are in.
2. Sign out → Sign in → "Forgot password?" → code → new password.
