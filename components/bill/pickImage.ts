import { Platform } from 'react-native';
import type { ImageSource } from '@/core/scanner/types';

const MAX_DIMENSION = 1280;

/** ย่อรูป (web: canvas) ก่อนส่งขึ้น API เพื่อประหยัด token/ค่าใช้จ่าย */
function downscaleDataUrl(dataUrl: string, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * เปิด file picker เลือกรูปบิล แล้วคืน ImageSource (data URL ย่อแล้ว)
 * web เท่านั้น — native ต้องใช้ camera/expo-image-picker ใน Phase 3
 */
export function pickImageFromDevice(
  onPicked: (image: ImageSource) => void,
  onError: (error: Error) => void,
): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    onError(new Error('ยังไม่รองรับการเลือกรูปบนมือถือ — จะมาใน Phase 3 (กล้อง)'));
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      downscaleDataUrl(dataUrl, MAX_DIMENSION)
        .then((small) => onPicked({ uri: small, name: file.name, mimeType: file.type }))
        .catch(() => onPicked({ uri: dataUrl, name: file.name, mimeType: file.type }));
    };
    reader.onerror = () => onError(new Error('อ่านไฟล์รูปไม่สำเร็จ'));
    reader.readAsDataURL(file);
  };
  input.click();
}
