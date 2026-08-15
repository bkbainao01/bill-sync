/** แปลงบาท → สตางค์ (int) — เก็บยอดเป็นสตางค์เสมอเพื่อหลีกเลี่ยง float error */
export function toSatang(baht: number): number {
  return Math.round(baht * 100);
}

/** แปลงสตางค์ (int) → บาท */
export function fromSatang(satang: number): number {
  return satang / 100;
}
