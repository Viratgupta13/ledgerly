import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanAndImport } from '../src/sms/scan';
import { useAuthStore } from '../src/store/auth';
import { Button, Card, LinkButton, Text, ink, muted } from '../src/ui/components';

const POINTS = [
  { icon: 'funnel-outline', color: '#3525cd', title: 'We only look for payment messages', body: 'Debit and credit alerts from banks and UPI apps.' },
  { icon: 'shield-half-outline', color: '#ba1a1a', title: 'OTPs and promos are ignored', body: 'Security codes and marketing messages are skipped.' },
  { icon: 'receipt-outline', color: '#006c49', title: 'Only the basics are saved', body: 'Amount, payee, date, category and your note. Never the SMS text.' },
] as const;

/** Shown once before Android's own permission dialog, to explain what SMS access is for. */
export default function SmsPermission() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allow = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await scanAndImport(userId, 30, { askPermission: true });
      qc.invalidateQueries({ queryKey: ['txns'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read SMS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface dark:bg-dk-surface" style={{ paddingTop: insets.top + 8 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-surface-container p-4 dark:bg-dk-lowest">
          <Card className="p-3">
            <Text className={`text-xs ${muted}`}>Example bank SMS</Text>
            <Text className={`mt-1 text-sm ${ink}`}>A/c XX4092 debited INR 349.00 at BLINKIT on 24-Oct. UPI Ref 4298…</Text>
          </Card>
          <View className="my-2 items-center">
            <Ionicons name="arrow-down" size={18} color="#3525cd" />
          </View>
          <Card className="flex-row items-center justify-between p-3">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-surface-container">
                <Ionicons name="restaurant" size={20} color="#F97316" />
              </View>
              <View>
                <Text className={`font-inter-sb ${ink}`}>Blinkit</Text>
                <Text className={`text-xs ${muted}`}>Food</Text>
              </View>
            </View>
            <Text className={`font-inter-sb ${ink}`}>-₹349.00</Text>
          </Card>
        </View>

        <Text className={`mt-6 font-inter-b text-3xl ${ink}`}>Let Expensefy read your bank SMS</Text>
        <Text className={`mt-2 text-base ${muted}`}>To track your expenses with almost no typing, Expensefy needs permission to read your SMS.</Text>

        <View className="mt-5 gap-3">
          {POINTS.map((p) => (
            <Card key={p.title} className="flex-row items-center gap-3 p-4">
              <Ionicons name={p.icon} size={24} color={p.color} />
              <View className="flex-1">
                <Text className={`font-inter-sb ${ink}`}>{p.title}</Text>
                <Text className={`text-sm ${muted}`}>{p.body}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-surface-container px-4 py-3 dark:bg-dk-lowest">
          <Ionicons name="lock-closed-outline" size={16} color="#3525cd" />
          <Text className={`flex-1 text-sm ${ink}`}>SMS are processed on this phone, not uploaded.</Text>
        </View>
        {error && <Text className="mt-3 text-error">{error}</Text>}
      </ScrollView>

      <View className="px-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label="Allow SMS access" iconRight="arrow-forward" loading={busy} onPress={allow} />
        <View className="mt-1 items-center">
          <LinkButton label="Not now" onPress={() => router.back()} />
        </View>
        <Text className={`mt-1 text-center text-xs ${muted}`}>You can change this anytime in Android Settings.</Text>
      </View>
    </View>
  );
}
