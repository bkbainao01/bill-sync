import { Platform } from 'react-native';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

function webNotification(): typeof Notification | null {
  return typeof window !== 'undefined' && 'Notification' in window
    ? (window as { Notification?: typeof Notification }).Notification ?? null
    : null;
}

/** สถานะ permission ปัจจุบัน (ไม่ถาม) */
export async function getNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    const N = webNotification();
    if (!N) return 'unsupported';
    if (N.permission === 'granted') return 'granted';
    if (N.permission === 'denied') return 'denied';
    return 'undetermined';
  }
  try {
    const mod = await import('expo-notifications');
    const { status } = await mod.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

/** ขอ permission — web ต้องมาจาก user gesture (ปุ่ม) จึงจะได้ prompt จริง */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    const N = webNotification();
    if (!N) return 'unsupported';
    const result = await N.requestPermission();
    if (result === 'granted') return 'granted';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  }
  try {
    const mod = await import('expo-notifications');
    const { status } = await mod.requestPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

/** แสดง notification ทันที — web ใช้ Notification API, native ส่ง local notification */
export async function showNotification(title: string, body: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const N = webNotification();
    if (!N || N.permission !== 'granted') return false;
    try {
      new N(title, { body });
      return true;
    } catch {
      return false;
    }
  }
  try {
    const mod = await import('expo-notifications');
    await mod.scheduleNotificationAsync({ content: { title, body }, trigger: null });
    return true;
  } catch {
    return false;
  }
}

/**
 * นัดหมาย notification ล่วงหน้า (native เท่านั้น) — แสดงตอน 09:00 ของวันเตือน
 * web: ไม่รองรับการนัดหมายแบบนี้ (คืน false)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  at: Date,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (at.getTime() <= Date.now()) return showNotification(title, body);
  try {
    const mod = await import('expo-notifications');
    await mod.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: mod.SchedulableTriggerInputTypes.DATE, date: at },
    });
    return true;
  } catch {
    return false;
  }
}
