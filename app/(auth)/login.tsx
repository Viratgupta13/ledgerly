import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { supabase } from '../../src/lib/supabase';
import { Button, Icon, Input, SHADOW_SM, Text, ink, muted } from '../../src/ui/components';

const credentials = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<{ title: string; body?: string } | null>(null);
  const [notice, setNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const validEmail = z.string().email().safeParse(email.trim()).success;
  const bars = strength(password);

  async function submit() {
    setError(null);
    setNotice(false);
    const parsed = credentials.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError({ title: parsed.error.issues[0].message });
      return;
    }
    setBusy(true);
    const { data, error: authError } = signup ? await supabase.auth.signUp(parsed.data) : await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (authError) setError({ title: signup ? 'Could not create account' : 'Invalid login credentials', body: authError.message });
    else if (signup && !data.session) setNotice(true);
  }

  const switchMode = () => {
    setMode(signup ? 'signin' : 'signup');
    setError(null);
    setNotice(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}>
        {notice && (
          <View style={SHADOW_SM} className="mb-4 flex-row items-start gap-2 rounded-xl bg-secondary-container p-4">
            <Icon name="check-circle" size={20} color="#00714d" />
            <View className="flex-1">
              <Text className="font-inter-sb text-title-md text-on-secondary-container">Check your email</Text>
              <Text className="mt-0.5 text-body-sm text-on-secondary-container">We sent a verification link to confirm your account.</Text>
            </View>
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
              <Text className="font-inter-b text-headline-md text-on-primary">₹</Text>
            </View>
          </View>
          {signup && (
            <View className="mb-1 flex-row items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5">
              <View className="h-1.5 w-1.5 rounded-full bg-primary" />
              <Text className="font-inter-sb text-label-sm text-primary">Ledgerly</Text>
            </View>
          )}
          <Text className={`font-inter-b text-headline-lg ${ink}`}>{signup ? 'Create your account' : 'Ledgerly'}</Text>
          <Text className={`mt-1 max-w-[280px] text-center text-body-md ${muted}`}>
            {signup ? 'Start tracking bank & UPI payments effortlessly.' : 'Your bank SMS, turned into a clean expense log.'}
          </Text>
        </View>

        {!signup && (
          <View className="mb-4 flex-row items-center gap-1.5 self-center rounded-full bg-surface-container-low px-3 py-1">
            <Icon name="verified-user" size={16} color="#006c49" />
            <Text className="font-inter-md text-label-sm text-secondary">SMS are read and sorted on this phone</Text>
          </View>
        )}

        <View className="gap-4">
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className={`font-inter-md text-label-md ${signup ? muted : ink}`}>Email address</Text>
              {signup ? (
                <Text className="font-inter-md text-label-sm text-primary">Required</Text>
              ) : validEmail ? (
                <View className="flex-row items-center gap-0.5">
                  <Icon name="check-circle" size={14} color="#006c49" />
                  <Text className="font-inter-sb text-label-sm text-secondary">Looks good</Text>
                </View>
              ) : null}
            </View>
            <Input icon="mail" placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className={`font-inter-md text-label-md ${signup ? muted : ink}`}>Password</Text>
              {signup ? <Text className="text-label-sm text-outline">Min. 6 chars</Text> : null}
            </View>
            <Input
              icon="lock"
              placeholder={signup ? 'Create a strong password' : 'Enter your password'}
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

          {signup && (
            <View style={SHADOW_SM} className="overflow-hidden rounded-2xl bg-surface-container p-4">
              <View className="flex-row items-start gap-4">
                <View style={SHADOW_SM} className="h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest">
                  <Icon name="security" size={24} color="#006c49" />
                </View>
                <View className="flex-1">
                  <Text className={`font-inter-sb text-title-md ${ink}`}>Your SMS never leave your phone.</Text>
                  <Text className={`mt-0.5 text-body-sm ${muted}`}>All SMS reading and categorisation happens on-device. Your personal messages and OTPs are never uploaded.</Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5">
                      <Icon name="verified" size={12} color="#006c49" />
                      <Text className="font-inter-sb text-label-sm text-secondary">100% On-Device</Text>
                    </View>
                    <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                      <Icon name="lock" size={12} color="#3525cd" />
                      <Text className="font-inter-sb text-label-sm text-primary">Zero OTP Read</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <Button size="lg" className={signup ? 'rounded-[14px] bg-primary-container' : 'bg-primary-container'} label={signup ? 'Create account' : 'Sign in'} iconRight="arrow-forward" loading={busy} onPress={submit} />
        </View>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className={`text-body-md ${muted}`}>{signup ? 'Have an account?' : 'New here?'}</Text>
          <Pressable onPress={switchMode} hitSlop={10} className="ml-1 min-h-11 flex-row items-center justify-center">
            <Text className="font-inter-b text-label-lg text-primary">{signup ? 'Sign in' : 'Create an account'}</Text>
          </Pressable>
        </View>

        {!signup && <Text className={`mx-auto mt-6 max-w-[320px] text-center text-label-sm opacity-80 ${muted}`}>By signing in, you agree to local SMS parsing. Financial SMS alerts stay on this phone.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
