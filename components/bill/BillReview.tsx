import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, ButtonText, Input, InputField, Text, VStack, HStack } from '@gluestack-ui/themed';
import type { Bill } from '@/core/entities/bill';
import type { Category } from '@/core/entities/category';
import { suggestedTransactionFromBill } from '@/core/scanner/parse';
import { fromSatang } from '@/core/calculations/money';
import { validateTransactionInput } from '@/core/validators/transaction';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CategoryChips } from '../category/CategoryChips';

const COLORS = {
  primary: '#0891b2',
  danger: '#dc2626',
  white: '#ffffff',
};

export interface ConfirmPayload {
  merchant: string | null;
  amountSatang: number;
  categoryId: string | null;
  date: string;
  note: string | null;
}

interface Props {
  bill: Bill;
  categories: Category[];
  onConfirm: (payload: ConfirmPayload) => void;
  onReject: () => void;
  isPending?: boolean;
}

function FieldRow({
  label,
  value,
  onChangeText,
  confidence,
  edited,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  confidence: number;
  edited?: boolean;
  placeholder?: string;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <VStack space="xs">
      <HStack space="sm" alignItems="center">
        <Text size="sm" fontWeight="$semibold">
          {label}
        </Text>
        <ConfidenceBadge confidence={confidence} edited={edited} />
      </HStack>
      <Input>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          inputMode={keyboardType === 'numeric' ? 'decimal' : 'text'}
        />
      </Input>
    </VStack>
  );
}

export function BillReview({ bill, categories, onConfirm, onReject, isPending }: Props) {
  const suggested = suggestedTransactionFromBill(bill);
  const ex = bill.extracted;

  const [merchant, setMerchant] = useState(suggested.merchant ?? '');
  const [totalBaht, setTotalBaht] = useState(
    suggested.amountSatang > 0 ? String(fromSatang(suggested.amountSatang)) : '',
  );
  const [date, setDate] = useState(suggested.date);
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mark = (key: string, setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty((d) => ({ ...d, [key]: true }));
  };

  const submit = () => {
    const result = validateTransactionInput({
      type: 'expense',
      amountBaht: totalBaht,
      categoryId,
      date,
      merchant,
      note,
    });
    if (!result.ok || result.amountSatang === undefined) {
      setErrors(result.errors as Record<string, string>);
      return;
    }
    setErrors({});
    onConfirm({
      merchant: merchant.trim() || null,
      amountSatang: result.amountSatang,
      categoryId,
      date,
      note: note.trim() || null,
    });
  };

  const totalConfidence = ex.total?.confidence ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <VStack space="md">
        {ex.summary?.value && ex.merchant?.value ? (
          <Text size="sm" color="$textLight400">
            AI อ่านเจอ: {ex.summary.value}
          </Text>
        ) : null}

        {bill.imageUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: bill.imageUri }} style={styles.image} resizeMode="contain" />
          </View>
        ) : null}

        {Object.keys(errors).length > 0 ? (
          <Text color={COLORS.danger} size="sm">
            {Object.values(errors).join(' · ')}
          </Text>
        ) : null}

        <FieldRow
          label="ร้านค้า / ผู้รับเงิน"
          value={merchant}
          onChangeText={mark('merchant', setMerchant)}
          confidence={ex.merchant?.confidence ?? 0}
          edited={dirty.merchant}
          placeholder="ชื่อร้าน"
        />

        <FieldRow
          label="ยอดรวม (บาท)"
          value={totalBaht}
          onChangeText={mark('total', setTotalBaht)}
          confidence={totalConfidence}
          edited={dirty.total}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <FieldRow
          label="วันที่"
          value={date}
          onChangeText={mark('date', setDate)}
          confidence={ex.date?.confidence ?? 0}
          edited={dirty.date}
          placeholder="YYYY-MM-DD"
        />

        {ex.vat?.value != null ? (
          <HStack space="sm" alignItems="center" justifyContent="space-between">
            <Text size="sm" fontWeight="$semibold">
              VAT (7%)
            </Text>
            <HStack space="sm" alignItems="center">
              <Text size="sm">{ex.vat.value.toFixed(2)} บาท</Text>
              <ConfidenceBadge confidence={ex.vat.confidence} />
            </HStack>
          </HStack>
        ) : null}

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold">
            หมวดหมู่
          </Text>
          <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        </VStack>

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold">
            หมายเหตุ
          </Text>
          <Input>
            <InputField value={note} onChangeText={setNote} placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)" />
          </Input>
        </VStack>

        <HStack space="sm" style={{ marginTop: 8 }}>
          <Button
            flex={1}
            variant="outline"
            borderColor={COLORS.danger}
            onPress={onReject}
            isDisabled={isPending}
          >
            <ButtonText style={{ color: COLORS.danger }}>ปฏิเสธ</ButtonText>
          </Button>
          <Button
            flex={1}
            bgColor={COLORS.primary}
            onPress={submit}
            isDisabled={isPending}
          >
            <ButtonText style={{ color: COLORS.white }}>
              {isPending ? 'กำลังบันทึก…' : 'ยืนยันและบันทึก'}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  imageWrap: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    maxHeight: 200,
  },
  image: { width: '100%', height: 180 },
});
