/** ยืนยันการกระทำ — web ใช้ window.confirm, native ตกเป็น true (Phase 3 ใช้ Alert) */
export function confirmAction(message: string): boolean {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  return true;
}
