import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ButtonText, Input, InputField, Text, VStack, HStack } from '@gluestack-ui/themed';
import type { RecurringCadence } from '@/core/entities/recurringBill';
import { createRecurringBill } from '@/core/entities/recurringBill';
import { formatBaht } from '@/core/calculations/format';
import { toSatang } from '@/core/calculations/money';
import { CADENCE_RANGES, validateRecurringInput } from '@/core/validators/recurring';
import { useCategories } from '@/hooks/useCategories';
import { useCreateRecurringBill } from '@/hooks/useRecurringBills';
import { CategoryChips } from '../category/CategoryChips';
import { WEEKDAY_THAI } from '@/core/recurring/period';
import { BRAND } from '@/theme/tokens';
import { hapticSuccess } from '@/lib/haptics';

const COLORS = {
  primary: BRAND,
  white: '#ffffff',
  muted: '#64748b',
  danger: '#dc2626',
};

const CADENCE_OPTIONS: Array<{ value: RecurringCadence; label: string }> = [
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'weekly', label: 'รายสัปดาห์' },
  { value: 'yearly', label: 'รายปี' },
];

export function RecurringForm({ onDone }: { onDone?: () => void }) {
  const { data: categories = [] } = useCategories();
  const createRb = useCreateRecurringBill();

  const [merchant, setMerchant] = useState('');
  const [amountBaht, setAmountBaht] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cadence, setCadence] = useState<RecurringCadence>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [month, setMonth] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const amountPreview =
    Number.isFinite(Number(amountBaht)) && Number(amountBaht) > 0
      ? formatBaht(toSatang(Number(amountBaht)))
      : null;

  const switchCadence = (next: RecurringCadence) => {
    setCadence(next);
    setDayOfMonth(next === 'weekly' ? '1' : '1');
  };

  const submit = async () => {
    const result = validateRecurringInput({
      merchant,
      amountBaht,
      categoryId,
      cadence,
      dayOfMonth,
      month,
    });
    if (
      !result.ok ||
      result.amountSatang === undefined ||
      result.dayOfMonth === undefined ||
      categoryId === null
    ) {
      setErrors(result.errors as Record<string, string>);
      return;
    }
    setErrors({});
    const rb = createRecurringBill({
      merchant,
      amountSatang: result.amountSatang,
      categoryId,
      cadence,
      dayOfMonth: result.dayOfMonth,
      month: result.month,
    });
    await createRb.mutateAsync(rb);
    hapticSuccess(); // iOS: บันทึกบิลประจำสำเร็จ
    setMerchant('');
    setAmountBaht('');
    setCategoryId(null);
    setCadence('monthly');
    setDayOfMonth('1');
    setMonth('1');
    onDone?.();
  };

  const range = CADENCE_RANGES[cadence];

  return (
    <VStack space="md" style={styles.form}>
      {Object.keys(errors).length > 0 ? (
        <Text color={COLORS.danger} size="sm">
          {Object.values(errors).join(' · ')}
        </Text>
      ) : null}

      <VStack space="xs">
        <Text size="sm" fontWeight="$semibold">
          ชื่อผู้รับเงิน
        </Text>
        <Input>
          <InputField placeholder="เช่น การไฟฟ้านครหลวง" value={merchant} onChangeText={setMerchant} />
        </Input>
      </VStack>

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
        </Input>            {amountPreview ? (
          <Text size="xs" color={COLORS.muted} selectable>
            = {amountPreview}
          </Text>
        ) : null}
      </VStack>

      <VStack space="xs">
        <Text size="sm" fontWeight="$semibold">
          หมวดหมู่
        </Text>
        <CategoryChips categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} />
      </VStack>

      <VStack space="xs">
        <Text size="sm" fontWeight="$semibold">
          รอบบิล
        </Text>
        <HStack space="sm">
          {CADENCE_OPTIONS.map((opt) => {
            const active = cadence === opt.value;
            return (
              <Button
                key={opt.value}
                size="sm"
                variant={active ? 'solid' : 'outline'}
                style={{ backgroundColor: active ? COLORS.primary : 'transparent', flex: 1 }}
                borderColor={active ? COLORS.primary : '#cbd5e1'}
                onPress={() => switchCadence(opt.value)}
              >
                <ButtonText style={{ color: active ? COLORS.white : undefined }}>{opt.label}</ButtonText>
              </Button>
            );
          })}
        </HStack>
      </VStack>

      <HStack space="sm" alignItems="flex-start">
        <VStack space="xs" flex={1}>
          <Text size="sm" fontWeight="$semibold">
            {cadence === 'weekly' ? 'วันในสัปดาห์ (0-6)' : 'วันที่ของเดือน (1-31)'}
          </Text>
          <Input size="sm">
            <InputField
              keyboardType="numeric"
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              inputMode="numeric"
            />
          </Input>
          <Text size="xs" color={COLORS.muted}>
            {cadence === 'weekly'
              ? `0=${WEEKDAY_THAI[0]} 1=${WEEKDAY_THAI[1]} … 6=${WEEKDAY_THAI[6]}`
              : range.label}
          </Text>
        </VStack>
        {cadence === 'yearly' ? (
          <VStack space="xs" flex={1}>
            <Text size="sm" fontWeight="$semibold">
              เดือน (1-12)
            </Text>
            <Input size="sm">
              <InputField
                keyboardType="numeric"
                value={month}
                onChangeText={setMonth}
                inputMode="numeric"
              />
            </Input>
            <Text size="xs" color={COLORS.muted}>
              1=มกราคม … 12=ธันวาคม
            </Text>
          </VStack>
        ) : null}
      </HStack>

      <Button
        onPress={submit}
        isDisabled={createRb.isPending}
        style={{ backgroundColor: COLORS.primary }}
      >
        <ButtonText style={{ color: COLORS.white }}>
          {createRb.isPending ? 'กำลังบันทึก…' : 'บันทึกบิลประจำ'}
        </ButtonText>
      </Button>
    </VStack>
  );
}

const styles = StyleSheet.create({
  form: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
});
