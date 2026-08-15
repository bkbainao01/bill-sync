import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ReminderNotifier } from '@/components/recurring/ReminderNotifier';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ReminderNotifier />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="transaction/new"
            options={{
              headerShown: true,
              title: 'เพิ่มรายการ',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="scan"
            options={{
              headerShown: true,
              title: 'สแกนบิล',
            }}
          />
          <Stack.Screen
            name="recurring"
            options={{
              headerShown: true,
              title: 'บิลประจำ',
            }}
          />
          <Stack.Screen
            name="camera"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
