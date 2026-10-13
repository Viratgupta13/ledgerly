import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { supabase } from '../../src/lib/supabase';

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
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp(parsed.data);
    setBusy(false);
    if (authError) setError(authError.message);
    else if (mode === 'signup' && !data.session) setNotice('Check your email to confirm your account.');
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-white px-6 dark:bg-black">
      <Text className="text-3xl font-bold text-black dark:text-white">Expensefy</Text>
      <TextInput
        className="rounded-lg border border-gray-300 px-4 py-3 text-black dark:text-white"
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="rounded-lg border border-gray-300 px-4 py-3 text-black dark:text-white"
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text className="text-red-600">{error}</Text>}
      {notice && <Text className="text-green-600">{notice}</Text>}
      <Pressable className="items-center rounded-lg bg-blue-600 py-3" onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="white" /> : (
          <Text className="font-semibold text-white">{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
        )}
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text className="text-center text-blue-600">
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}
