import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, ButtonText, Input, InputField, Text, VStack, HStack, Switch } from '@gluestack-ui/themed';
import type { Bill } from '@/core/entities/bill';
import type { Category } from '@/core/entities/category';
import type { RecurringBill } from '@/core/entities/recurringBill';
import { suggestedTransactionFromBill } from '@/core/scanner/parse';
import { fromSatang, toSatang } from '@/core/calculations/money';
import { validateTransactionInput } from '@/core/validators/transaction';
import { suggestRecurringLink } from '@/core/recurring/match';
import { cadenceLabel } from '@/core/recurring/period';
import { formatBaht } from '@/core/calculations/format';
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
  /** recurring bill ที่เชื่อม (ถ้าผู้ใช้เปิดสวิตช์) */
  recurringBillId: string | null;
}

interface Props {
  bill: Bill;
  categories: Category[];
  onConfirm: (payload: ConfirmPayload) => void;
  onReject: () => void;
  isPending?: boolean;
  /** บิลประจำทั้งหมด — ใช้แนะนำ link อัตโนมัติ (ร้านเดิม/ยอดใกล้เคียง) */
  recurringBills?: RecurringBill[];
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

export function BillReview({ bill, categories, onConfirm, onReject, isPending, recurringBills }: Props) {
  const suggested = suggestedTransactionFromBill(bill);
  const ex = bill.extracted;

  const [merchant, setMerchant] = useState(suggested.merchant ?? '');
  const [totalBaht, setTotalBaht] = useState(
    suggested.amountSatang > 0 ? String(fromSatang(suggested.amountSatang)) : '',
  );
  const [date, setDate] = useState(suggested.date);
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [linkRecurringId, setLinkRecurringId] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // แนะนำ recurring bill จากค่าที่ผู้ใช้กำลังเห็น (อัปเดตเมื่อแก้ไขร้าน/ยอด)
  const match = useMemo(() => {
    if (!recurringBills || recurringBills.length === 0) return null;
    const amount = totalBaht.trim() ? toSatang(Number(totalBaht)) : null;
    if (amount != null && !Number.isFinite(amount)) return null;
    return suggestRecurringLink({
      merchant: merchant.trim() || null,
      amountSatang: amount,
      recurringBills,
    });
  }, [recurringBills, merchant, totalBaht]);

  const matchedRb = match ? recurringBills?.find((r) => r.id === match.recurringBillId) ?? null : null;
  const linkedRb = linkRecurringId
    ? recurringBills?.find((r) => r.id === linkRecurringId) ?? null
    : null;

  const toggleLink = (on: boolean) => {
    setLinkRecurringId(on && match ? match.recurringBillId : null);
  };

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
      recurringBillId: linkRecurringId,
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

        {match && matchedRb ? (
          <View style={{ backgroundColor: '#ecfeff', borderRadius: 12, padding: 12 }}>
            <HStack space="md" alignItems="center" justifyContent="space-between">
              <VStack space="xs" flex={1}>
                <Text size="sm" fontWeight="$bold" style={{ color: '#155e75' }}>
                  เจอบิลประจำที่ตรงกัน
                </Text>
                <Text size="sm" style={{ color: '#155e75' }}>
                  {matchedRb.merchant} · {cadenceLabel(matchedRb)} · {formatBaht(matchedRb.amount)}
                </Text>
                <Text size="xs" style={{ color: '#0e7490' }}>
                  {match.reasons.join(' · ')} — บันทึกรายการนี้แล้วจะนับว่า "จ่ายแล้ว" ของบิลนี้
                </Text>
              </VStack>
              <Switch
                value={linkRecurringId === match.recurringBillId}
                onValueChange={toggleLink}
              />
            </HStack>
          </View>
        ) : null}

        {linkedRb && !match ? (
          <View style={{ backgroundColor: '#ecfeff', borderRadius: 12, padding: 12 }}>
            <HStack space="md" alignItems="center" justifyContent="space-between">
              <Text size="sm" style={{ color: '#155e75' }} flex={1}>
                เชื่อมกับบิลประจำ: {linkedRb.merchant} ({cadenceLabel(linkedRb)})
              </Text>
              <Switch value onValueChange={() => setLinkRecurringId(null)} />
            </HStack>
          </View>
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
