import '../global.css';
import '../src/background/task';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { supabase } from '../src/lib/supabase';
import { TAB, useTabStore } from '../src/store/tabs';
import { lockLightMode } from '../src/ui/appearance';
import { useAuthStore } from '../src/store/auth';

function Routes() {
  const { session, initialized, recovering, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [setSession]);

  // Tapping a notification opens the Inbox.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!initialized || !session) return;
    if (response?.notification.request.content.data?.screen === 'inbox') useTabStore.getState().go(TAB.inbox);
  }, [response, initialized, session]);

  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && !recovering}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sms-permission" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session || recovering}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

lockLightMode();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <Routes />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
