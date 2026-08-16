import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BRAND } from '@/theme/tokens';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        headerTitleStyle: { fontWeight: '700' },
        // พื้นหลัง header/tab bar — native ใช้สีระบบ (ปรับตาม light/dark อัตโนมัติ), web ใช้แบรนด์
        headerStyle: { backgroundColor: colors.systemBackground },
        tabBarStyle: {
          backgroundColor: colors.systemBackground,
          borderTopColor: colors.separator,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการ',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'สรุป',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'ตั้งค่า',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
