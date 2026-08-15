import { useEffect, useRef } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { dueSoonBills } from '@/core/recurring/reminders';
import { todayKey, formatDateThai } from '@/core/calculations/format';
import { useReminderSettings } from '@/store/reminderSettings';
import { getNotificationPermission, showNotification } from '@/lib/notify';

/**
 * เช็คบิลใกล้ครบกำหนดตอนเปิดแอป แล้วส่ง OS notification สำหรับรอบที่ยังไม่เคยแจ้ง
 * (render เปล่าๆ ใน root layout — permission ต้องถูก grant จากหน้าการตั้งค่าแล้ว)
 */
export function ReminderNotifier() {
  const { data: transactions = [], isSuccess: txLoaded } = useTransactions();
  const { data: recurringBills = [], isSuccess: rbLoaded } = useRecurringBills();
  const enabled = useReminderSettings((s) => s.enabled);
  const leadDays = useReminderSettings((s) => s.leadDays);
  const notifiedKeys = useReminderSettings((s) => s.notifiedKeys);
  const markNotified = useReminderSettings((s) => s.markNotified);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !enabled || !txLoaded || !rbLoaded) return;
    if (recurringBills.length === 0) return;
    ran.current = true;

    void (async () => {
      try {
        const permission = await getNotificationPermission();
        if (permission !== 'granted') return;
        const due = dueSoonBills({
          recurringBills,
          transactions,
          todayStr: todayKey(),
          leadDays,
        });
        for (const d of due) {
          const key = `${d.recurringBill.id}:${d.periodKey}`;
          if (notifiedKeys.includes(key)) continue;
          const label =
            d.daysUntil < 0
              ? `เลยกำหนดแล้ว (${formatDateThai(d.expectedDate)})`
              : d.daysUntil === 0
                ? 'ครบกำหนดวันนี้'
                : `อีก ${d.daysUntil} วัน`;
          await showNotification(`บิลใกล้ครบกำหนด: ${d.recurringBill.merchant}`, label);
          markNotified(key);
        }
      } catch {
        // การแจ้งเตือนล้มเหลวไม่ควรทำให้แอปพัง
      }
    })();
  }, [enabled, txLoaded, rbLoaded, recurringBills, transactions, leadDays, notifiedKeys, markNotified]);

  return null;
}
