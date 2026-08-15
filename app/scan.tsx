import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box, Button, ButtonText, Card, Center, Spinner, Text, VStack, HStack } from '@gluestack-ui/themed';
import type { Bill } from '@/core/entities/bill';
import type { ImageSource } from '@/core/scanner/types';
import { extractionToBill } from '@/core/scanner/parse';
import { transitionBill } from '@/core/bills/flow';
import { createTransaction } from '@/core/entities/transaction';
import { nowIso } from '@/core/entities/base';
import { formatBaht, formatDateThai } from '@/core/calculations/format';
import { toSatang } from '@/core/calculations/money';
import { createLlmProvider } from '@/adapters/scanner/providers';
import { pickImageFromDevice } from '@/components/bill/pickImage';
import { BillReview, type ConfirmPayload } from '@/components/bill/BillReview';
import { useCategories } from '@/hooks/useCategories';
import { useBills, useCreateBill, useUpdateBill } from '@/hooks/useBills';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useScannerSettings } from '@/store/scannerSettings';

type Stage = 'idle' | 'scanning' | 'review' | 'error';

const STATUS_LABEL: Record<Bill['status'], string> = {
  scanned: 'รอตรวจ',
  reviewing: 'กำลังตรวจ',
  confirmed: 'บันทึกแล้ว',
  rejected: 'ปฏิเสธ',
};

const STATUS_COLOR: Record<Bill['status'], string> = {
  scanned: '#b45309',
  reviewing: '#0369a1',
  confirmed: '#15803d',
  rejected: '#b91c1c',
};

export default function ScanScreen() {
  const router = useRouter();
  const settings = useScannerSettings();
  const { data: categories = [] } = useCategories();
  const { data: bills = [] } = useBills();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const createTx = useCreateTransaction();

  const [stage, setStage] = useState<Stage>('idle');
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const pickImage = () => {
    if (!settings.allowCloud) {
      setStage('error');
      setError('ยังไม่ได้เปิดอนุญาตให้ AI อ่านบิล — ไปที่หน้าการตั้งค่า แล้วเปิด "อนุญาต AI อ่านบิล"');
      return;
    }
    if (!settings.apiKey.trim()) {
      setStage('error');
      setError('ยังไม่ได้ตั้งค่า API key ของ AI — ไปที่หน้าการตั้งค่า แล้วกรอก API key');
      return;
    }
    pickImageFromDevice(
      (image) => void handleImage(image),
      (err) => {
        setStage('error');
        setError(err.message);
      },
    );
  };

  const handleImage = async (image: ImageSource) => {
    if (!settings.allowCloud) {
      setStage('error');
      setError('ยังไม่ได้เปิดอนุญาตให้ AI อ่านบิล — ไปที่หน้าการตั้งค่า แล้วเปิด "อนุญาต AI อ่านบิล"');
      return;
    }
    const provider = createLlmProvider({
      provider: settings.provider,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
    });
    if (!provider) {
      setStage('error');
      setError('ยังไม่ได้ตั้งค่า API key ของ AI — ไปที่หน้าการตั้งค่า แล้วกรอก API key');
      return;
    }

    setStage('scanning');
    setError(null);
    try {
      const extraction = await provider.extract(image);
      const scanned = extractionToBill(extraction, image);
      await createBill.mutateAsync(scanned);
      const reviewing = transitionBill(scanned, 'startReview', nowIso());
      await updateBill.mutateAsync(reviewing);
      setBill(reviewing);
      setStage('review');
    } catch (e) {
      setStage('error');
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการอ่านบิล');
    }
  };

  const handleConfirm = async (payload: ConfirmPayload) => {
    if (!bill) return;
    setIsPending(true);
    try {
      const tx = createTransaction({
        type: 'expense',
        amountSatang: payload.amountSatang,
        categoryId: payload.categoryId,
        date: payload.date,
        merchant: payload.merchant,
        note: payload.note,
      });
      await createTx.mutateAsync(tx);
      const confirmed = { ...transitionBill(bill, 'confirm', nowIso()), transactionId: tx.id };
      await updateBill.mutateAsync(confirmed);
      router.back();
    } catch {
      setError('บันทึกรายการไม่สำเร็จ กรุณาลองอีกครั้ง');
      setStage('error');
    } finally {
      setIsPending(false);
    }
  };

  const handleReject = async () => {
    if (!bill) return;
    setIsPending(true);
    try {
      await updateBill.mutateAsync(transitionBill(bill, 'reject', nowIso()));
      setBill(null);
      setStage('idle');
    } finally {
      setIsPending(false);
    }
  };

  const reset = () => {
    setBill(null);
    setError(null);
    setStage('idle');
  };

  return (
    <Box flex={1} padding={16} bg="$backgroundLight50">
      {stage === 'review' && bill ? (
        <BillReview
          bill={bill}
          categories={expenseCategories}
          onConfirm={(p) => void handleConfirm(p)}
          onReject={() => void handleReject()}
          isPending={isPending}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <VStack space="md">
            <Card style={{ borderRadius: 12 }}>
              <VStack space="sm">
                <HStack space="sm" alignItems="center">
                  <Ionicons name="scan-outline" size={20} color="#0891b2" />
                  <Text fontWeight="$bold" size="lg">
                    สแกนบิลด้วย AI
                  </Text>
                </HStack>
                <Text size="sm" color="$textLight400">
                  เลือกรูปใบเสร็จ/บิล แล้ว AI จะอ่านชื่อร้าน ยอดรวม และวันที่ให้อัตโนมัติ — คุณตรวจสอบก่อนยืนยัน
                </Text>

                {!settings.allowCloud ? (
                  <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: 12 }}>
                    <Text size="sm" color="#92400e">
                      ยังไม่ได้เปิดอนุญาตให้ AI อ่านบิล (รูปจะถูกส่งขึ้นคลาวด์) — ไปที่การตั้งค่าเพื่อเปิด
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="#d97706"
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      onPress={() => router.push('/settings')}
                    >
                      <ButtonText color="#b45309">ไปที่การตั้งค่า</ButtonText>
                    </Button>
                  </View>
                ) : null}

                {stage === 'scanning' ? (
                  <Center style={{ paddingVertical: 24 }}>
                    <Spinner color="#0891b2" />
                    <Text size="sm" color="$textLight400" style={{ marginTop: 8 }}>
                      AI กำลังอ่านบิล…
                    </Text>
                  </Center>
                ) : (
                  <Button
                    bgColor="#0891b2"
                    onPress={pickImage}
                    isDisabled={!settings.allowCloud}
                  >
                    <Ionicons name="image-outline" size={18} color="#ffffff" />
                    <ButtonText style={{ color: '#ffffff', marginLeft: 6 }}>เลือกภาพบิล</ButtonText>
                  </Button>
                )}

                {stage === 'error' ? (
                  <VStack space="sm">
                    <Text size="sm" color="$textError700">
                      {error}
                    </Text>
                    <HStack space="sm">
                      <Button size="sm" variant="outline" borderColor="#cbd5e1" onPress={reset}>
                        <ButtonText>ลองใหม่</ButtonText>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="#cbd5e1"
                        onPress={() => router.push('/settings')}
                      >
                        <ButtonText>การตั้งค่า</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                ) : null}
              </VStack>
            </Card>

            {bills.length > 0 ? (
              <Card style={{ borderRadius: 12 }}>
                <VStack space="sm">
                  <Text fontWeight="$bold" size="lg">
                    ประวัติการสแกน ({bills.length})
                  </Text>
                  {bills.map((b) => (
                    <HStack key={b.id} space="sm" alignItems="center" justifyContent="space-between">
                      <VStack space="xs" flex={1}>
                        <Text size="sm" fontWeight="$semibold" numberOfLines={1}>
                          {b.extracted.merchant?.value ?? 'บิล (ยังไม่ได้อ่าน)'}
                        </Text>
                        <Text size="xs" color="$textLight400">
                          {b.extracted.date?.value ? formatDateThai(b.extracted.date.value) : 'วันที่ไม่ทราบ'}
                          {b.extracted.total?.value != null ? ` · ${formatBaht(toSatang(b.extracted.total.value))}` : ''}
                        </Text>
                      </VStack>
                      <Text size="xs" style={{ color: STATUS_COLOR[b.status], fontWeight: '700' }}>
                        {STATUS_LABEL[b.status]}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            ) : null}
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
