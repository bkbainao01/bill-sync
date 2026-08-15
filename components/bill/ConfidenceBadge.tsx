import { View, Text } from 'react-native';

interface Props {
  confidence: number;
  /** user แก้ไขค่าเองแล้ว */
  edited?: boolean;
}

function badgeStyle(confidence: number) {
  if (confidence >= 0.9) return { bg: '#dcfce7', text: '#15803d' };
  if (confidence >= 0.7) return { bg: '#fef3c7', text: '#b45309' };
  return { bg: '#fee2e2', text: '#b91c1c' };
}

export function ConfidenceBadge({ confidence, edited }: Props) {
  if (edited) {
    return (
      <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
        <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: '600' }}>แก้ไขเอง</Text>
      </View>
    );
  }
  const { bg, text } = badgeStyle(confidence);
  const pct = Math.round(confidence * 100);
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
      <Text style={{ fontSize: 11, color: text, fontWeight: '600' }}>มั่นใจ {pct}%</Text>
    </View>
  );
}
