import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { Button, ButtonText, Center, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import type { Bill } from '@/core/entities/bill';
import { extractionToBill } from '@/core/scanner/parse';
import { parseOcrText } from '@/core/scanner/ocr';
import { transitionBill } from '@/core/bills/flow';
import { nowIso } from '@/core/entities/base';
import { useCreateBill, useUpdateBill } from '@/hooks/useBills';

const MAX_DIMENSION = 1280;

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  // web: กล้อง/ML Kit เป็น native-only — แนะนำให้ใช้การอัปโหลด
  if (Platform.OS === 'web') {
    return (
      <Center flex={1} padding={24}>
        <VStack space="md" alignItems="center">
          <Ionicons name="phone-portrait-outline" size={48} color="#94a3b8" />
          <Text fontWeight="$bold" size="lg" textAlign="center">
            กล้องรองรับเฉพาะมือถือ
          </Text>
          <Text size="sm" color="$textLight400" textAlign="center">
            บนเว็บ ให้ใช้การเลือกภาพบิลแทน (OCR on-device ต้องรันบน iOS/Android)
          </Text>
          <Button bgColor="#0891b2" onPress={() => router.push('/scan')}>
            <ButtonText style={{ color: '#ffffff' }}>กลับไปสแกนบิล</ButtonText>
          </Button>
        </VStack>
      </Center>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: MAX_DIMENSION } }],
        { compress: 0.85 },
      );

      // OCR on-device (ML Kit) — import แบบ dynamic เพื่อกันปัญหาใน web bundle
      const { recognizeText } = await import(
        '@infinitered/react-native-mlkit-text-recognition'
      );
      const { text } = await recognizeText(processed.uri);
      if (!text || !text.trim()) {
        setError('อ่านข้อความในภาพไม่เจอ — ลองถ่ายใหม่ให้ชัดเจนขึ้น หรือใช้สแกน AI');
        return;
      }

      const extraction = parseOcrText(text);
      const scanned: Bill = { ...extractionToBill(extraction, { uri: processed.uri }), rawText: text };
      await createBill.mutateAsync(scanned);
      const reviewing = transitionBill(scanned, 'startReview', nowIso());
      await updateBill.mutateAsync(reviewing);
      router.replace({ pathname: '/scan', params: { billId: scanned.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ถ่ายรูป/อ่านบิลไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <Center flex={1}>
        <Spinner color="#0891b2" />
      </Center>
    );
  }

  if (!permission.granted) {
    return (
      <Center flex={1} padding={24}>
        <VStack space="md" alignItems="center">
          <Ionicons name="camera-outline" size={48} color="#94a3b8" />
          <Text fontWeight="$bold" size="lg" textAlign="center">
            ต้องใช้กล้องเพื่อถ่ายบิล
          </Text>
          <Text size="sm" color="$textLight400" textAlign="center">
            รูปถูกประมวลผลในเครื่องเท่านั้น (OCR on-device) — ไม่ส่งขึ้นอินเทอร์เน็ต
          </Text>
          <Button bgColor="#0891b2" onPress={() => void requestPermission()}>
            <ButtonText style={{ color: '#ffffff' }}>อนุญาตการเข้าถึงกล้อง</ButtonText>
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} facing="back" style={StyleSheet.absoluteFill} />

      <View style={styles.overlayTop}>
        <Text style={styles.hint}>วางบิลให้เต็มกรอบ แล้วกดปุ่มถ่าย</Text>
      </View>

      {busy ? (
        <View style={styles.overlay}>
          <Spinner color="#ffffff" size="large" />
          <Text style={styles.hint}>กำลังอ่านข้อความจากบิล…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Button
          isDisabled={busy}
          onPress={() => void capture()}
          style={styles.captureButton}
          accessibilityLabel="ถ่ายรูปบิล"
        >
          <Ionicons name="camera" size={28} color="#ffffff" />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayTop: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  errorBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 120,
    backgroundColor: 'rgba(220,38,38,0.9)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: '#ffffff', fontSize: 13, textAlign: 'center' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff22',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
