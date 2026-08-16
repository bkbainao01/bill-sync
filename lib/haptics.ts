import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback — ใช้บน iOS/Android เท่านั้น (web: no-op)
 * ใส่จังหวะสัมผัสเล็กๆ ให้แอป "รู้สึก" เหมือนแอป native ตอน action สำคัญ
 */
export function hapticImpact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(style).catch(() => {});
}

/** สำเร็จ (บันทึก/ยืนยันสำเร็จ) */
export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** เลือก/แตะทั่วไป */
export function hapticSelection(): void {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => {});
}
