import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { Button, CodeInput, Icon, Input, SHADOW_SM, Text, ink, muted } from '../../src/ui/components';

type Step = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

const emailSchema = z.string().email('Enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const RESEND_SECONDS = 30;

/** 0-3 filled bars for the password strength meter on the sign-up form. */
function strength(p: string): number {
  if (p.length < 6) return 0;
  let s = 1;
  if (p.length >= 8) s += 1;
  if (/[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  return s;
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const setRecovering = useAuthStore((s) => s.setRecovering);
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<{ title: string; body?: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const signup = step === 'signup';
  const bars = strength(password);
  const validEmail = emailSchema.safeParse(email.trim()).success;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (next: Step) => {
    setStep(next);
    setError(null);
    setInfo(null);
    setCode('');
  };
  const fail = (title: string, body?: string) => setError({ title, body });

  async function submitCredentials() {
    setError(null);
    const e = emailSchema.safeParse(email.trim());
    const p = passwordSchema.safeParse(password);
    if (!e.success || !p.success) return fail((e.success ? p : e).error!.issues[0].message);
    setBusy(true);
    if (signup) {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      setBusy(false);
      if (err) return fail('Could not create account', err.message);
      if (!data.session) {
        setCooldown(RESEND_SECONDS);
        go('verify');
      }
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      if (/not confirmed/i.test(err.message)) {
        // Signed up earlier but never entered the code: send a fresh one.
        await supabase.auth.resend({ type: 'signup', email: email.trim() });
        setCooldown(RESEND_SECONDS);
        go('verify');
        return;
      }
      fail('Invalid login credentials', err.message);
    }
  }

  async function verifySignup() {
    if (code.length !== 6) return fail('Enter the 6-digit code');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'signup' });
    setBusy(false);
    if (err) fail('That code did not work', 'Check the code and try again, or ask for a new one.');
  }

  async function sendResetCode() {
    setError(null);
    const e = emailSchema.safeParse(email.trim());
    if (!e.success) return fail(e.error.issues[0].message);
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (err) return fail('Could not send the code', err.message);
    setCooldown(RESEND_SECONDS);
    go('reset');
  }

  async function resetPassword() {
    setError(null);
    if (code.length !== 6) return fail('Enter the 6-digit code');
    const p = passwordSchema.safeParse(password);
    if (!p.success) return fail(p.error.issues[0].message);
    setBusy(true);
    // The code signs the user in; keep them on this screen until the new password is saved.
    setRecovering(true);
    const verified = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'recovery' });
    if (verified.error) {
      setRecovering(false);
      setBusy(false);
      return fail('That code did not work', 'Check the code and try again, or ask for a new one.');
    }
    const updated = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updated.error) {
      setRecovering(false);
      return fail('Could not set the new password', updated.error.message);
    }
    setRecovering(false); // the session is already active, so the app opens now
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null);
    const { error: err } =
      step === 'verify' ? await supabase.auth.resend({ type: 'signup', email: email.trim() }) : await supabase.auth.resetPasswordForEmail(email.trim());
    if (err) return fail('Could not resend the code', err.message);
    setCooldown(RESEND_SECONDS);
    setInfo('A new code is on its way.');
  }

  const titles: Record<Step, { title: string; sub: string }> = {
    signin: { title: 'Ledgerly', sub: 'Your bank SMS, turned into a clean expense log.' },
    signup: { title: 'Create your account', sub: 'Start tracking bank & UPI payments effortlessly.' },
    verify: { title: 'Check your email', sub: `We sent a 6-digit code to ${email.trim()}. Enter it to verify your account.` },
    forgot: { title: 'Reset your password', sub: "Enter your email and we'll send you a 6-digit code." },
    reset: { title: 'Enter the code', sub: `We sent a 6-digit code to ${email.trim()}. Enter it with your new password.` },
  };

  const emailField = (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className={`font-inter-md text-label-md ${signup ? muted : ink}`}>Email address</Text>
        {signup ? <Text className="font-inter-md text-label-sm text-primary">Required</Text> : null}
      </View>
      <Input icon="mail" placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
    </View>
  );

  const passwordField = (label: string, placeholder: string) => (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className={`font-inter-md text-label-md ${signup ? muted : ink}`}>{label}</Text>
        {step === 'signin' ? (
          <Pressable onPress={() => go('forgot')} hitSlop={10}>
            <Text className="font-inter-sb text-label-md text-primary">Forgot password?</Text>
          </Pressable>
        ) : (
          <Text className="text-label-sm text-outline">Min. 6 chars</Text>
        )}
      </View>
      <Input
        icon="lock"
        placeholder={placeholder}
        secureTextEntry={!show}
        value={password}
        onChangeText={setPassword}
        right={
          <Pressable onPress={() => setShow(!show)} hitSlop={10} className="h-10 w-10 items-center justify-center">
            <Icon name={show ? 'visibility-off' : 'visibility'} size={20} color="#464555" />
          </Pressable>
        }
      />
      {signup && (
        <View className="flex-row items-center justify-between px-1 pt-1">
          <View className="flex-row items-center gap-1.5">
            <Icon name="verified-user" size={14} color="#777587" />
            <Text className={`text-label-sm ${muted}`}>At least 6 characters</Text>
          </View>
          <View className="flex-row items-center gap-1">
            {[0, 1, 2].map((i) => (
              <View key={i} className={`h-1 w-4 rounded-full ${i < bars ? 'bg-primary-container' : 'bg-surface-container-high'}`} />
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const resendRow = (
    <View className="items-center">
      <Pressable onPress={resend} disabled={cooldown > 0} hitSlop={10} className="min-h-11 justify-center">
        <Text className={`font-inter-sb text-label-lg ${cooldown > 0 ? 'text-outline' : 'text-primary'}`}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}>
        {info && (
          <View style={SHADOW_SM} className="mb-4 flex-row items-center gap-2 rounded-xl bg-secondary-container p-3.5">
            <Icon name="check-circle" size={20} color="#00714d" />
            <Text className="flex-1 font-inter-sb text-label-lg text-on-secondary-container">{info}</Text>
          </View>
        )}
        {error && (
          <View style={SHADOW_SM} className="mb-4 flex-row items-start gap-2 rounded-xl bg-error-container p-3.5">
            <Icon name="error" size={20} color="#ba1a1a" />
            <View className="flex-1">
              <Text className="font-inter-sb text-label-lg text-error">{error.title}</Text>
              {error.body ? <Text className="mt-0.5 text-body-sm text-on-error-container">{error.body}</Text> : null}
            </View>
            <Pressable onPress={() => setError(null)} hitSlop={10}>
              <Icon name="close" size={18} color="#93000a" />
            </Pressable>
          </View>
        )}

        <View className="mb-6 mt-1 items-center">
          <View style={{ shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }} className="mb-3 h-14 w-14 items-center justify-center rounded-xl bg-surface-container-lowest p-1.5">
            <View className="h-full w-full items-center justify-center rounded-lg bg-primary">
              {step === 'verify' || step === 'reset' ? <Icon name="mark-email-read" size={26} color="#ffffff" /> : <Text className="font-inter-b text-headline-md text-on-primary">₹</Text>}
            </View>
          </View>
          <Text className={`text-center font-inter-b text-headline-lg ${ink}`}>{titles[step].title}</Text>
          <Text className={`mt-1 max-w-[300px] text-center text-body-md ${muted}`}>{titles[step].sub}</Text>
        </View>

        {step === 'signin' || step === 'signup' ? (
          <View className="gap-4">
            {emailField}
            {passwordField('Password', signup ? 'Create a strong password' : 'Enter your password')}
            {signup && (
              <View style={SHADOW_SM} className="overflow-hidden rounded-2xl bg-surface-container p-4">
                <View className="flex-row items-start gap-4">
                  <View style={SHADOW_SM} className="h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest">
                    <Icon name="security" size={24} color="#006c49" />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-inter-sb text-title-md ${ink}`}>Your SMS never leave your phone.</Text>
                    <Text className={`mt-0.5 text-body-sm ${muted}`}>All SMS reading and categorisation happens on-device. Your personal messages and OTPs are never uploaded.</Text>
                  </View>
                </View>
              </View>
            )}
            <Button size="lg" className="bg-primary-container" label={signup ? 'Create account' : 'Sign in'} iconRight="arrow-forward" loading={busy} onPress={submitCredentials} />
            <View className="flex-row items-center justify-center">
              <Text className={`text-body-md ${muted}`}>{signup ? 'Have an account?' : 'New here?'}</Text>
              <Pressable onPress={() => go(signup ? 'signin' : 'signup')} hitSlop={10} className="ml-1 min-h-11 justify-center">
                <Text className="font-inter-b text-label-lg text-primary">{signup ? 'Sign in' : 'Create an account'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 'verify' ? (
          <View className="gap-4">
            <CodeInput value={code} onChange={setCode} />
            <Button size="lg" className="bg-primary-container" label="Verify" iconRight="arrow-forward" loading={busy} disabled={code.length !== 6} onPress={verifySignup} />
            {resendRow}
            <Pressable onPress={() => go('signup')} hitSlop={10} className="min-h-11 items-center justify-center">
              <Text className={`text-body-md ${muted}`}>Wrong email? <Text className="font-inter-sb text-primary">Change it</Text></Text>
            </Pressable>
          </View>
        ) : null}

        {step === 'forgot' ? (
          <View className="gap-4">
            {emailField}
            <Button size="lg" className="bg-primary-container" label="Send code" iconRight="arrow-forward" loading={busy} disabled={!validEmail} onPress={sendResetCode} />
            <Pressable onPress={() => go('signin')} hitSlop={10} className="min-h-11 items-center justify-center">
              <Text className="font-inter-sb text-label-lg text-primary">Back to sign in</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 'reset' ? (
          <View className="gap-4">
            <CodeInput value={code} onChange={setCode} />
            {passwordField('New password', 'Choose a new password')}
            <Button size="lg" className="bg-primary-container" label="Set new password" iconRight="arrow-forward" loading={busy} disabled={code.length !== 6 || password.length < 6} onPress={resetPassword} />
            {resendRow}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
