import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTxns } from '../../src/data/hooks';
import { breakdown, type Period } from '../../src/reports/breakdown';
import { Card, CategoryTile, Empty, Icon, ProgressBar, Screen, Text, ink, muted, rupees, SectionLabel } from '../../src/ui/components';
import { categoryMeta, tint } from '../../src/ui/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const AVATAR_COLORS = ['#3525cd', '#c20038', '#006c49', '#131b2e'];
const avatarColor = (s: string) => AVATAR_COLORS[(s.trim().toUpperCase().charCodeAt(0) || 0) % AVATAR_COLORS.length];

function Hero({ value }: { value: number }) {
  const [whole, dec] = value.toFixed(2).split('.');
  return (
    <Text style={{ fontVariant: ['tabular-nums'] }} className="font-inter-b text-display-mobile text-on-primary">
      ₹{Number(whole).toLocaleString('en-IN')}
      <Text className="font-inter-b text-display-mobile text-on-primary opacity-80">.{dec}</Text>
    </Text>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useTxns('confirmed');
  const toReview = useTxns('pending').data?.length ?? 0;
  const now = new Date();
  const [period, setPeriod] = useState<Period>({ year: now.getFullYear(), month: now.getMonth() });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const allTime = period === 'all';
  const report = breakdown(data ?? [], period);

  const shift = (delta: number) => {
    if (period === 'all') return;
    const d = new Date(period.year, period.month + delta, 1);
    setPeriod({ year: d.getFullYear(), month: d.getMonth() });
    setOpenCat(null);
    setOpenGroup(null);
  };

  let delta: number | null = null;
  let dailyAverage: number | null = null;
  if (period !== 'all') {
    const prev = new Date(period.year, period.month - 1, 1);
    const before = breakdown(data ?? [], { year: prev.getFullYear(), month: prev.getMonth() }).total;
    if (before > 0) delta = Math.round(((report.total - before) / before) * 100);
    const isCurrent = period.year === now.getFullYear() && period.month === now.getMonth();
    dailyAverage = report.total / (isCurrent ? now.getDate() : new Date(period.year, period.month + 1, 0).getDate());
  }
  const prevLabel = period !== 'all' ? SHORT[(period.month + 11) % 12] : '';
  const txnCount = report.categories.reduce((n, c) => n + c.count, 0);
  const top = report.categories.slice(0, 5);
  const rest = report.categories.slice(5).reduce((n, c) => n + c.total, 0);
  const pct = (n: number) => (report.total > 0 ? Math.round((n / report.total) * 100) : 0);

  return (
    <Screen headerTitle="Home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 24 }}>
        {/* Month + scope */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Pressable onPress={() => shift(-1)} disabled={allTime} className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-container">
              <Icon name="chevron-left" size={22} color={allTime ? '#c7c4d8' : '#131b2e'} />
            </Pressable>
            <Text className={`font-inter-sb text-headline-sm ${ink}`}>{allTime ? 'All time' : `${MONTHS[period.month]} ${period.year}`}</Text>
            <Pressable onPress={() => shift(1)} disabled={allTime} className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-container">
              <Icon name="chevron-right" size={22} color={allTime ? '#c7c4d8' : '#131b2e'} />
            </Pressable>
          </View>
          <View className="flex-row rounded-full bg-surface-container p-1 dark:bg-dk-container">
            {(['month', 'all'] as const).map((k) => {
              const active = (k === 'all') === allTime;
              return (
                <Pressable
                  key={k}
                  onPress={() => setPeriod(k === 'all' ? 'all' : { year: now.getFullYear(), month: now.getMonth() })}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : ''}`}
                >
                  <Text className={`font-inter-sb text-label-sm ${active ? 'text-on-primary' : muted}`}>{k === 'month' ? 'Show by month' : 'All time'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Hero */}
        <View
          style={{ shadowColor: '#3525cd', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}
          className="gap-4 overflow-hidden rounded-[20px] bg-primary p-6"
        >
          <View className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-container opacity-30" />
          <View className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-secondary opacity-20" />
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-md text-label-md uppercase tracking-wide text-on-primary-container">{allTime ? 'Total spent' : `Spent in ${MONTHS[period.month]}`}</Text>
            {delta !== null && (
              <View className="flex-row items-center gap-1 rounded-full bg-surface-container-lowest/15 px-2.5 py-1">
                <Icon name={delta <= 0 ? 'trending-down' : 'trending-up'} size={14} color="#6ffbbe" />
                <Text className="font-inter-sb text-label-sm text-on-primary">{delta > 0 ? '+' : ''}{delta}% vs {prevLabel}</Text>
              </View>
            )}
          </View>
          <View className="gap-1">
            <Hero value={report.total} />
            <Text className="text-body-sm text-on-primary-container">Tracked across {txnCount} confirmed {txnCount === 1 ? 'payment' : 'payments'}</Text>
          </View>
          <View className="flex-row gap-2 pt-1">
            <View className="flex-1 flex-row items-center gap-2.5 rounded-xl bg-surface-container-lowest/10 p-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-container-lowest/20">
                <Icon name="calendar-today" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-sb text-label-sm uppercase text-on-primary-container">{dailyAverage === null ? 'Payments' : 'Daily average'}</Text>
                <Text style={{ fontVariant: ['tabular-nums'] }} className="font-inter-sb text-label-lg text-on-primary" numberOfLines={1}>
                  {dailyAverage === null ? txnCount : rupees(dailyAverage)}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => router.navigate('/inbox')} className="flex-1 flex-row items-center gap-2.5 rounded-xl bg-surface-container-lowest/10 p-2.5 active:opacity-70">
              <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: tint('#6ffbbe', 0.3) }}>
                <Icon name="auto-awesome" size={18} color="#6ffbbe" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-sb text-label-sm uppercase text-on-primary-container">To review</Text>
                <Text className="font-inter-sb text-label-lg text-on-primary" numberOfLines={1}>{toReview} {toReview === 1 ? 'payment' : 'payments'}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text className="text-error">{error.message}</Text>}
        {!isLoading && report.categories.length === 0 && (
          <Empty icon="pie-chart" title="No spending to show" hint={allTime ? 'Confirm payments in your Inbox to populate category reports.' : 'Nothing confirmed this month. Try "All time".'} />
        )}

        {/* Distribution */}
        {report.categories.length > 0 && (
          <Card className="gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className={`font-inter-sb text-title-md ${ink}`}>Spending Distribution</Text>
              <Text className={`font-inter-sb text-label-sm ${muted}`}>{report.categories.length} Categories</Text>
            </View>
            <View className="h-3 flex-row gap-0.5 overflow-hidden rounded-full bg-surface-container p-0.5 dark:bg-dk-container">
              {top.map((c) => (
                <View key={c.name} className="h-full rounded-full" style={{ flex: c.total, backgroundColor: categoryMeta(c.name).color }} />
              ))}
              {rest > 0 && <View className="h-full rounded-full bg-outline" style={{ flex: rest }} />}
            </View>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
              {top.map((c) => (
                <View key={c.name} className="flex-row items-center gap-1.5">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryMeta(c.name).color }} />
                  <Text className={`font-inter-sb text-label-sm ${muted}`}>{c.name} ({pct(c.total)}%)</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Categories */}
        {report.categories.length > 0 && (
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className={`font-inter-b text-headline-sm ${ink}`}>Categories</Text>
              <Text className={`text-body-sm ${muted}`}>Sorted by amount</Text>
            </View>

            {report.categories.map((c) => {
              const meta = categoryMeta(c.name);
              const open = openCat === c.name;
              return (
                <Card key={c.name} className="overflow-hidden">
                  <Pressable className="flex-row items-center justify-between p-4 active:opacity-70" onPress={() => setOpenCat(open ? null : c.name)}>
                    <View className="flex-1 flex-row items-center gap-3">
                      <CategoryTile category={c.name} />
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className={`flex-shrink font-inter-sb text-title-md ${ink}`} numberOfLines={1}>{c.name}</Text>
                          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        </View>
                        <Text className={`text-body-sm ${muted}`}>{c.count} {c.count === 1 ? 'payment' : 'payments'}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-3 pl-2">
                      <View className="items-end">
                        <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b text-title-md ${ink}`}>{rupees(c.total)}</Text>
                        <Text className={`font-inter-sb text-label-sm ${muted}`}>{pct(c.total)}% of total</Text>
                      </View>
                      <Icon name={open ? 'expand-less' : 'expand-more'} size={20} color="#464555" />
                    </View>
                  </Pressable>
                  <View className="px-4 pb-1">
                    <ProgressBar share={c.total / report.total} color={meta.color} />
                  </View>

                  {open ? (
                    <View className="gap-1 px-4 pb-4 pt-2">
                      <View className="px-1 py-1"><SectionLabel>Top payees</SectionLabel></View>
                      {c.merchants.map((m) => {
                        const id = `${c.name}:${m.key}`;
                        const expanded = openGroup === id;
                        const letter = m.label.trim().charAt(0).toUpperCase();
                        return (
                          <View key={m.key} className="overflow-hidden rounded-xl bg-surface-container-low dark:bg-dk-low">
                            <Pressable className="flex-row items-center justify-between p-3 active:opacity-70" onPress={() => setOpenGroup(expanded ? null : id)}>
                              <View className="flex-1 flex-row items-center gap-2.5">
                                <View className="h-7 w-7 items-center justify-center rounded-lg bg-surface-container-lowest dark:bg-dk-lowest">
                                  <Text className="font-inter-b text-label-md" style={{ color: avatarColor(letter) }}>{letter}</Text>
                                </View>
                                <View className="flex-1">
                                  <Text className={`font-inter-sb text-label-lg ${ink}`} numberOfLines={1}>{m.label}</Text>
                                  <Text className={`font-inter-sb text-label-sm ${muted}`}>{m.count} {m.count === 1 ? 'payment' : 'payments'}</Text>
                                </View>
                              </View>
                              <View className="flex-row items-center gap-2 pl-2">
                                <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb text-label-lg ${ink}`}>{rupees(m.total)}</Text>
                                <Icon name="unfold-more" size={16} color="#464555" />
                              </View>
                            </Pressable>
                            {expanded ? (
                              <View className="gap-1.5 px-3 pb-3 pt-1">
                                {m.items.map((i) => (
                                  <View key={i.id} className="flex-row items-center justify-between rounded-lg bg-surface-container-lowest p-2 dark:bg-dk-lowest">
                                    <View className="flex-1 pr-3">
                                      <Text className={`font-inter-md text-body-md ${ink}`} numberOfLines={1}>{i.who}</Text>
                                      <Text className={`text-body-sm ${muted}`} numberOfLines={1}>
                                        {[new Date(i.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), i.note].filter(Boolean).join(' · ')}
                                      </Text>
                                    </View>
                                    <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb text-title-md ${ink}`}>-{rupees(i.amount)}</Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
