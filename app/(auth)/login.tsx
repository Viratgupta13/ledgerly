import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { supabase } from '../../src/lib/supabase';
import { Button, Input, Text, ink, muted } from '../../src/ui/components';

const credentials = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';

  async function submit() {
    setError(null);
    setNotice(null);
    const parsed = credentials.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error: authError } = signup ? await supabase.auth.signUp(parsed.data) : await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (authError) setError(authError.message);
    else if (signup && !data.session) setNotice('Check your email to confirm your account.');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface dark:bg-dk-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary">
            <Text className="font-inter-b text-4xl text-white">₹</Text>
          </View>
          <Text className={`mt-5 font-inter-b text-3xl ${ink}`}>{signup ? 'Create your account' : 'Expensefy'}</Text>
          <Text className={`mt-2 text-center text-base ${muted}`}>
            {signup ? 'Start tracking bank & UPI payments effortlessly.' : 'Your bank SMS, turned into a clean expense log.'}
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <Input label="Email address" icon="mail-outline" placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <View>
            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder={signup ? 'Create a strong password' : 'Your password'}
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
              right={
                <Pressable onPress={() => setShow(!show)} hitSlop={10}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#777587" />
                </Pressable>
              }
            />
            {signup && <Text className={`mt-1.5 text-xs ${muted}`}>At least 6 characters</Text>}
          </View>

          {error && <Text className="text-error">{error}</Text>}
          {notice && <Text className="text-secondary">{notice}</Text>}

          <Button label={signup ? 'Create account' : 'Sign in'} iconRight="arrow-forward" loading={busy} onPress={submit} />
        </View>

        {signup && (
          <View className="mt-5 flex-row gap-3 rounded-2xl bg-surface-container p-4 dark:bg-dk-lowest">
            <Ionicons name="shield-checkmark" size={26} color="#006c49" />
            <View className="flex-1">
              <Text className={`font-inter-sb ${ink}`}>Your SMS never leave your phone.</Text>
              <Text className={`mt-0.5 text-sm ${muted}`}>Messages are read and sorted on this phone. Only the amount, payee, date, category and note are saved to your account.</Text>
            </View>
          </View>
        )}

        <View className="mt-6 flex-row items-center justify-center">
          <Text className={muted}>{signup ? 'Have an account? ' : 'New here? '}</Text>
          <Pressable onPress={() => { setMode(signup ? 'signin' : 'signup'); setError(null); setNotice(null); }} hitSlop={10} className="min-h-11 justify-center">
            <Text className="font-inter-sb text-primary">{signup ? 'Sign in' : 'Create an account'}</Text>
          </Pressable>
        </View>

        {!signup && <Text className={`mt-4 text-center text-xs ${muted}`}>Bank SMS are read and sorted on this phone.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
