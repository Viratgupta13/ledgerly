import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { z } from 'zod';
import { supabase } from '../../src/lib/supabase';
import { Button, Input, LinkButton, ink, muted } from '../../src/ui/components';

const credentials = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setNotice(null);
    const parsed = credentials.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error: authError } =
      mode === 'signin' ? await supabase.auth.signInWithPassword(parsed.data) : await supabase.auth.signUp(parsed.data);
    setBusy(false);
    if (authError) setError(authError.message);
    else if (mode === 'signup' && !data.session) setNotice('Check your email to confirm your account.');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <View className="mb-8">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
          <Text className="text-3xl font-bold text-white">₹</Text>
        </View>
        <Text className={`text-3xl font-bold ${ink}`}>Expensefy</Text>
        <Text className={`mt-1 ${muted}`}>Your bank SMS, turned into a clean expense log.</Text>
      </View>

      <View className="gap-3">
        <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text className="text-rose-600">{error}</Text>}
        {notice && <Text className="text-emerald-600">{notice}</Text>}
        <Button label={mode === 'signin' ? 'Sign in' : 'Create account'} loading={busy} onPress={submit} />
        <View className="items-center">
          <LinkButton label={mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'} onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
