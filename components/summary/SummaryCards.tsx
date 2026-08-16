import { Card, HStack, Text, VStack } from '@gluestack-ui/themed';
import type { Summary } from '@/core/calculations/summary';
import { formatBaht } from '@/core/calculations/format';
import { FONT_MONO, SEAM } from '@/theme/tokens';

interface Props {
  summary: Summary;
  /** % เปลี่ยนแปลงของรายจ่ายเทียบเดือนก่อนหน้า (null = ไม่มีข้อมูล) */
  expenseDelta?: number | null;
}

export function SummaryCards({ summary, expenseDelta }: Props) {
  const deltaText =
    expenseDelta == null
      ? null
      : expenseDelta > 0
        ? `▲ ${expenseDelta.toFixed(1)}% จากเดือนก่อน`
        : expenseDelta < 0
          ? `▼ ${Math.abs(expenseDelta).toFixed(1)}% จากเดือนก่อน`
          : 'เท่าเดิมจากเดือนก่อน';

  return (
    <HStack space="sm" style={{ marginBottom: 16 }}>
      <Card flex={1} style={cardStyle}>
        <VStack space="xs">
          <Text size="sm" color="$textLight400">
            รายรับ
          </Text>
          <Text fontWeight="$bold" color="$textSuccess700" size="md" selectable style={monoStyle}>
            {formatBaht(summary.income)}
          </Text>
        </VStack>
      </Card>
      <Card flex={1} style={cardStyle}>
        <VStack space="xs">
          <Text size="sm" color="$textLight400">
            รายจ่าย
          </Text>
          <Text fontWeight="$bold" color="$textError700" size="md" selectable style={monoStyle}>
            {formatBaht(summary.expense)}
          </Text>
          {deltaText ? (
            <Text size="xs" color="$textLight400">
              {deltaText}
            </Text>
          ) : null}
        </VStack>
      </Card>
      <Card flex={1} style={cardStyle}>
        <VStack space="xs">
          <Text size="sm" color="$textLight400">
            คงเหลือ
          </Text>
          <Text
            fontWeight="$bold"
            size="md"
            color={summary.balance >= 0 ? '$textPrimary700' : '$textError700'}
            selectable
            style={monoStyle}
          >
            {formatBaht(summary.balance)}
          </Text>
        </VStack>
      </Card>
    </HStack>
  );
}

/** การ์ดแบบสลิป — ขอบ hairline แทน shadow หนักๆ */
const cardStyle = {
  borderRadius: 10,
  borderWidth: 1,
  borderColor: SEAM,
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
};

/** ยอดเงิน — mono แบบพิมพ์ใบเสร็จ */
const monoStyle = {
  fontFamily: FONT_MONO,
  fontVariant: ['tabular-nums' as const],
};
