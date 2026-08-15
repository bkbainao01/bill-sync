import { useState } from 'react';
import { View } from 'react-native';
import { Card, Divider, HStack, Switch, Text, VStack, Button, ButtonText, Input, InputField } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { requestNotificationPermission, showNotification } from '@/lib/notify';
import { useReminderSettings } from '@/store/reminderSettings';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { transactionsToCsv, downloadTextFile } from '@/lib/export';
import { useThemeStore } from '@/store/theme';
import { useScannerSettings } from '@/store/scannerSettings';
import { recurringStatus } from '@/core/recurring/period';
import { todayKey } from '@/core/calculations/format';

const PROVIDER_OPTIONS = [
  { id: 'openai' as const, label: 'OpenAI-compatible' },
  { id: 'gemini' as const, label: 'Google Gemini' },
];

const ROADMAP_ITEMS = [
  { icon: 'phone-portrait-outline', label: 'แอปมือถือ (iOS/Android)', note: 'Phase 3 — เร็วๆ นี้' },
];

export default function SettingsScreen() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const router = useRouter();
  const colorMode = useThemeStore((s) => s.colorMode);
  const toggleColorMode = useThemeStore((s) => s.toggleColorMode);
  const scanner = useScannerSettings();
  const reminders = useReminderSettings();
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const { data: recurringBills = [] } = useRecurringBills();
  const dueCount = recurringBills.filter(
    (rb) => recurringStatus(rb, transactions, todayKey()).status === 'due',
  ).length;

  const exportCsv = () => {
    const csv = transactionsToCsv(transactions, categories);
    downloadTextFile(`billsync-${todayKey()}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const exportBackup = () => {
    const backup = {
      app: 'billsync',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
    };
    downloadTextFile(
      `billsync-backup-${todayKey()}.json`,
      JSON.stringify(backup, null, 2),
      'application/json;charset=utf-8',
    );
  };

  return (
    <VStack space="md" padding={16} flex={1}>
      <Card style={{ borderRadius: 12 }}>
        <HStack space="md" alignItems="center" justifyContent="space-between">
          <VStack space="xs">
            <Text fontWeight="$semibold">ธีมมืด</Text>
            <Text size="sm" color="$textLight400">
              สลับโหมดสว่าง/มืดของแอป
            </Text>
          </VStack>
          <Switch value={colorMode === 'dark'} onValueChange={toggleColorMode} />
        </HStack>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <VStack space="md">
          <Text fontWeight="$bold" size="lg">
            AI & การสแกนบิล
          </Text>
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <VStack space="xs" flex={1}>
              <Text fontWeight="$semibold">อนุญาต AI อ่านบิล</Text>
              <Text size="sm" color="$textLight400">
                เปิดแล้วรูปบิลจะถูกส่งขึ้นคลาวด์เพื่อให้ AI อ่าน (ปิดได้ทุกเมื่อ)
              </Text>
            </VStack>
            <Switch
              value={scanner.allowCloud}
              onValueChange={(v) => scanner.set({ allowCloud: v })}
            />
          </HStack>
          <Divider />
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              ผู้ให้บริการ AI
            </Text>
            <HStack space="sm">
              {PROVIDER_OPTIONS.map((opt) => {
                const active = scanner.provider === opt.id;
                return (
                  <Button
                    key={opt.id}
                    size="sm"
                    variant={active ? 'solid' : 'outline'}
                    style={{ backgroundColor: active ? '#0891b2' : 'transparent' }}
                    borderColor={active ? '#0891b2' : '#cbd5e1'}
                    onPress={() => scanner.set({ provider: opt.id })}
                  >
                    <ButtonText style={{ color: active ? '#ffffff' : undefined }}>
                      {opt.label}
                    </ButtonText>
                  </Button>
                );
              })}
            </HStack>
          </VStack>
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              API Key
            </Text>
            <Input>
              <InputField
                placeholder="sk-…"
                secureTextEntry
                value={scanner.apiKey}
                onChangeText={(v) => scanner.set({ apiKey: v })}
                autoCapitalize="none"
              />
            </Input>
          </VStack>
          {scanner.provider === 'openai' ? (
            <VStack space="xs">
              <Text size="sm" fontWeight="$semibold">
                Base URL
              </Text>
              <Input size="sm">
                <InputField
                  placeholder="https://api.openai.com/v1"
                  value={scanner.baseUrl}
                  onChangeText={(v) => scanner.set({ baseUrl: v })}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Input>
            </VStack>
          ) : null}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              Model
            </Text>
            <Input size="sm">
              <InputField
                placeholder="gpt-4o-mini / gemini-2.5-flash"
                value={scanner.model}
                onChangeText={(v) => scanner.set({ model: v })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </VStack>
          <Text size="xs" color="$textLight400">
            API key เก็บเฉพาะในเครื่องของคุณ (localStorage) — ไม่มีการส่งไปที่อื่นนอกจากผู้ให้บริการ AI ที่คุณเลือก
          </Text>
        </VStack>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <VStack space="md">
          <Text fontWeight="$bold" size="lg">
            การแจ้งเตือนบิล
          </Text>
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <VStack space="xs" flex={1}>
              <Text fontWeight="$semibold">แจ้งเตือนบิลใกล้ครบกำหนด</Text>
              <Text size="sm" color="$textLight400">
                แบนเนอร์ในแอปแสดงเสมอ — เปิดนี้เพื่อส่ง notification ของระบบด้วย
              </Text>
            </VStack>
            <Switch value={reminders.enabled} onValueChange={reminders.setEnabled} />
          </HStack>
          <Divider />
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <VStack space="xs" flex={1}>
              <Text size="sm" fontWeight="$semibold">
                แจ้งเตือนล่วงหน้า (วัน)
              </Text>
              <Text size="xs" color="$textLight400">
                0 = เฉพาะวันครบกำหนด
              </Text>
            </VStack>
            <Input size="sm" style={{ width: 96 }}>
              <InputField
                keyboardType="number-pad"
                value={String(reminders.leadDays)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n)) reminders.setLeadDays(n);
                }}
              />
            </Input>
          </HStack>
          <HStack space="sm" alignItems="center" justifyContent="space-between">
            <Button
              size="sm"
              variant="outline"
              borderColor="#cbd5e1"
              onPress={() => void (async () => {
                const status = await requestNotificationPermission();
                if (status !== 'granted') {
                  setNotifyMsg('ยังไม่อนุญาตให้ส่ง notification — อนุญาตในเบราว์เซอร์/ระบบ แล้วลองใหม่');
                  return;
                }
                const ok = await showNotification('BillSync', 'ทดสอบการแจ้งเตือนบิล ✅');
                setNotifyMsg(ok ? 'ส่งการแจ้งเตือนทดสอบแล้ว' : 'ส่งไม่สำเร็จ (บางเบราว์เซอร์ปิด notification)');
              })()}
            >
              <ButtonText>ทดสอบการแจ้งเตือน</ButtonText>
            </Button>
            {notifyMsg ? (
              <Text size="xs" color="$textLight400" flex={1} numberOfLines={2}>
                {notifyMsg}
              </Text>
            ) : null}
          </HStack>
          <Text size="xs" color="$textLight400">
            ใช้ระบบ notification ของเครื่อง (web: Notification API · มือถือ: expo-notifications) — ข้อมูลยังอยู่ในเครื่อง 100%
          </Text>
        </VStack>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <VStack space="sm">
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <VStack space="xs" flex={1}>
              <Text fontWeight="$semibold">บิลประจำ (รายเดือน/สัปดาห์/ปี)</Text>
              <Text size="sm" color="$textLight400">
                {recurringBills.length === 0
                  ? 'ยังไม่มีบิลประจำ'
                  : `${dueCount} รายการครบกำหนด · ${recurringBills.length} บิลทั้งหมด`}
              </Text>
            </VStack>
            <Button size="sm" bgColor="#0891b2" onPress={() => router.push('/recurring')}>
              <ButtonText style={{ color: '#ffffff' }}>จัดการ</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <VStack space="sm">
          <Text fontWeight="$bold" size="lg">
            ข้อมูล & การสำรอง
          </Text>
          <Text size="sm" color="$textLight400">
            ข้อมูลทั้งหมดถูกเก็บในเครื่องของคุณ 100% — ไม่ส่งขึ้นเซิร์ฟเวอร์
          </Text>
          <Divider />
          <Text size="sm">
            {transactions.length} รายการ · {categories.length} หมวดหมู่
          </Text>
          <HStack space="sm">
            <Button flex={1} size="sm" variant="outline" borderColor="#cbd5e1" onPress={exportCsv} isDisabled={transactions.length === 0}>
              <ButtonText numberOfLines={1}>ส่งออก CSV</ButtonText>
            </Button>
            <Button flex={1} size="sm" variant="outline" borderColor="#cbd5e1" onPress={exportBackup} isDisabled={transactions.length === 0}>
              <ButtonText numberOfLines={1}>สำรองข้อมูล</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <VStack space="sm">
          <Text fontWeight="$bold" size="lg">
            เร็วๆ นี้
          </Text>
          {ROADMAP_ITEMS.map((item, i) => (
            <View key={item.label}>
              {i > 0 ? <Divider style={{ marginVertical: 6 }} /> : null}
              <HStack space="sm" alignItems="center" justifyContent="space-between">
                <Text size="sm" fontWeight="$medium">
                  {item.label}
                </Text>
                <Text size="xs" color="$textLight400">
                  {item.note}
                </Text>
              </HStack>
            </View>
          ))}
        </VStack>
      </Card>

      <Text size="xs" color="$textLight400" textAlign="center">
        BillSync v0.1.0 — Local-first · Privacy-first
      </Text>
    </VStack>
  );
}
