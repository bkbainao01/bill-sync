import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText, Input, InputField, Text, VStack, HStack } from '@gluestack-ui/themed';
import type { TransactionType } from '@/core/entities/transaction';
import { createTransaction } from '@/core/entities/transaction';
import { todayKey, yesterdayKey, formatBaht } from '@/core/calculations/format';
import { toSatang } from '@/core/calculations/money';
import { validateTransactionInput } from '@/core/validators/transaction';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { CategoryChips } from '../category/CategoryChips';
import { BRAND } from '@/theme/tokens';
import { hapticSuccess } from '@/lib/haptics';

const COLORS = {
  primary: BRAND,
  income: '#16a34a',
  expense: '#dc2626',
  white: '#ffffff',
  muted: '#64748b',
};

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string; color: string }> = [
  { value: 'expense', label: 'รายจ่าย', color: COLORS.expense },
  { value: 'income', label: 'รายรับ', color: COLORS.income },
];

const DATE_PRESETS = [
  { label: 'วันนี้', value: todayKey() },
  { label: 'เมื่อวาน', value: yesterdayKey() },
];

export function TransactionForm() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountBaht, setAmountBaht] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(todayKey());
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeCategories = categories.filter((c) => c.type === type);

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategoryId(categories.find((c) => c.type === next)?.id ?? null);
  };

  const parsedAmount = Number(amountBaht);
  const amountPreview =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatBaht(toSatang(parsedAmount)) : null;

  const submit = async () => {
    const result = validateTransactionInput({ type, amountBaht, categoryId, date, merchant, note });
    if (!result.ok || result.amountSatang === undefined) {
      setErrors(result.errors as Record<string, string>);
      return;
    }
    setErrors({});
    const tx = createTransaction({
      type,
      amountSatang: result.amountSatang,
      categoryId,
      date,
      merchant,
      note,
    });
    try {
      await createTx.mutateAsync(tx);
      hapticSuccess(); // iOS: รู้สึกถึงการบันทึกสำเร็จ
      router.back();
    } catch {
      setErrors({ form: 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <VStack space="md">
          {Object.keys(errors).length > 0 ? (
            <Text color={COLORS.expense} size="sm">
              {Object.values(errors).join(' · ')}
            </Text>
          ) : null}

          {/* ประเภท */}
          <HStack space="sm">
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value;
              return (
                <Button
                  key={opt.value}
                  style={{ flex: 1, backgroundColor: active ? opt.color : 'transparent' }}
                  variant={active ? 'solid' : 'outline'}
                  borderColor={active ? opt.color : '#cbd5e1'}
                  onPress={() => switchType(opt.value)}
                >
                  <ButtonText style={{ color: active ? COLORS.white : undefined }}>
                    {opt.label}
                  </ButtonText>
                </Button>
              );
            })}
          </HStack>

          {/* ยอดเงิน */}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              ยอดเงิน (บาท)
            </Text>
            <Input>
              <InputField
                placeholder="0.00"
                keyboardType="numeric"
                inputMode="decimal"
                value={amountBaht}
                onChangeText={setAmountBaht}
              />
            </Input>
            {amountPreview ? (
              <Text size="xs" color={COLORS.muted} selectable>
                = {amountPreview}
              </Text>
            ) : null}
          </VStack>

          {/* หมวดหมู่ */}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              หมวดหมู่
            </Text>
            <CategoryChips categories={typeCategories} selectedId={categoryId} onSelect={setCategoryId} />
          </VStack>

          {/* วันที่ */}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              วันที่
            </Text>
            <HStack space="sm" alignItems="center">
              {DATE_PRESETS.map((preset) => {
                const active = date === preset.value;
                return (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant={active ? 'solid' : 'outline'}
                    style={{ backgroundColor: active ? COLORS.primary : 'transparent' }}
                    borderColor={active ? COLORS.primary : '#cbd5e1'}
                    onPress={() => setDate(preset.value)}
                  >
                    <ButtonText style={{ color: active ? COLORS.white : undefined }}>
                      {preset.label}
                    </ButtonText>
                  </Button>
                );
              })}
            </HStack>
            <Input size="sm">
              <InputField
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                autoCapitalize="none"
              />
            </Input>
          </VStack>

          {/* ร้านค้า */}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              ร้านค้า / ผู้รับเงิน
            </Text>
            <Input>
              <InputField placeholder="เช่น ร้านกาแฟ" value={merchant} onChangeText={setMerchant} />
            </Input>
          </VStack>

          {/* หมายเหตุ */}
          <VStack space="xs">
            <Text size="sm" fontWeight="$semibold">
              หมายเหตุ
            </Text>
            <Input>
              <InputField placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)" value={note} onChangeText={setNote} />
            </Input>
          </VStack>

          <Button
            onPress={submit}
            isDisabled={createTx.isPending}
            style={{ marginTop: 8, backgroundColor: COLORS.primary }}
          >
            <ButtonText style={{ color: COLORS.white }}>
              {createTx.isPending ? 'กำลังบันทึก…' : 'บันทึกรายการ'}
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 48,
  },
});
