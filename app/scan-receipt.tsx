import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, X, Check, Sparkles, ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';
import { useSubscription } from '@/hooks/subscription-store';
import { trpc } from '@/lib/trpc';

type ReceiptData = {
  merchant: string;
  amount: number;
  date: string;
  category: 'fuel' | 'maintenance' | 'insurance' | 'permits' | 'tolls' | 'parking' | 'food' | 'lodging' | 'repairs' | 'tires' | 'other';
  items?: string[];
};

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { hasFeatureAccess, isLoading: subscriptionLoading } = useSubscription();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const hasAccess = !subscriptionLoading && hasFeatureAccess('receiptScanner');

  useEffect(() => {
    console.log('ScanReceiptScreen mounted');
    console.log('Permission status:', permission?.granted);
    console.log('Has access:', hasAccess);
    console.log('Subscription loading:', subscriptionLoading);
    
    return () => {
      console.log('ScanReceiptScreen unmounted');
    };
  }, [hasAccess, permission?.granted, subscriptionLoading]);

  useEffect(() => {
    if (permission?.granted && hasAccess && !subscriptionLoading) {
      const timer = setTimeout(() => {
        setIsCameraReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsCameraReady(false);
    }
  }, [permission?.granted, hasAccess, subscriptionLoading]);

  if (subscriptionLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Sparkles size={64} color={theme.primary} style={styles.permissionIcon} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Premium Feature
          </Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            Receipt scanning with AI is a premium feature. Upgrade to Rork Pro to automatically extract expense data from receipts.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/upgrade')}
          >
            <Text style={styles.permissionButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={theme.text} style={styles.permissionIcon} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            We need access to your camera to scan receipts and extract expense data automatically.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log('Camera ref is null');
      return;
    }

    console.log('Taking picture...');

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      if (!photo) {
        Alert.alert('Error', 'Failed to capture image');
        setIsProcessing(false);
        return;
      }

      setCapturedImage(photo.uri);
      await processReceipt(photo.base64!);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsProcessing(false);
    }
  };

  const scanMutation = trpc.receipt.scan.useMutation();

  const processReceipt = async (base64Image: string) => {
    try {
      console.log('Processing receipt with AI...');
      console.log('Base64 image length:', base64Image.length);

      const result = await scanMutation.mutateAsync({ base64Image });
      console.log('Receipt processed successfully:', result);
      setExtractedData(result);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing receipt:', error);
      setIsProcessing(false);
      
      Alert.alert(
        'Processing Failed',
        'Unable to extract data from the receipt. Would you like to enter the details manually?',
        [
          {
            text: 'Enter Manually',
            onPress: () => router.push('/add-expense'),
          },
          {
            text: 'Retake Photo',
            onPress: retakePhoto,
            style: 'cancel',
          },
        ]
      );
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  const showManualEntryOption = () => {
    Alert.alert(
      'Receipt Captured',
      'AI extraction is currently unavailable. Would you like to enter the expense details manually while viewing your receipt?',
      [
        {
          text: 'Enter Manually',
          onPress: () => {
            router.push('/add-expense');
          },
        },
        {
          text: 'Retake Photo',
          onPress: retakePhoto,
          style: 'cancel',
        },
      ]
    );
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        setIsProcessing(true);
        if (asset.base64) {
          await processReceipt(asset.base64);
        } else {
          setIsProcessing(false);
          showManualEntryOption();
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const confirmAndAddExpense = () => {
    if (!extractedData) return;

    router.push({
      pathname: '/add-expense',
      params: {
        prefilledAmount: extractedData.amount.toString(),
        prefilledDescription: extractedData.merchant,
        prefilledCategory: extractedData.category,
        prefilledDate: extractedData.date,
        prefilledNotes: extractedData.items?.join(', ') || '',
      },
    });
  };

  if (capturedImage) {
    if (extractedData) {
      return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <ScrollView style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Sparkles size={32} color={theme.success} />
            <Text style={[styles.resultsTitle, { color: theme.text }]}>
              Receipt Scanned!
            </Text>
            <Text style={[styles.resultsSubtitle, { color: theme.textSecondary }]}>
              Review the extracted information below
            </Text>
          </View>

          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Merchant
              </Text>
              <Text style={[styles.dataValue, { color: theme.text }]}>
                {extractedData.merchant}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Amount
              </Text>
              <Text style={[styles.dataValue, { color: theme.success }]}>
                ${extractedData.amount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.dataValue, { color: theme.text }]}>
                {new Date(extractedData.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Category
              </Text>
              <Text style={[styles.dataValue, { color: theme.text }]}>
                {extractedData.category.charAt(0).toUpperCase() + extractedData.category.slice(1)}
              </Text>
            </View>

            {extractedData.items && extractedData.items.length > 0 && (
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                  Items
                </Text>
                <View style={styles.itemsList}>
                  {extractedData.items.map((item, index) => (
                    <Text key={index} style={[styles.itemText, { color: theme.text }]}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.success }]}
              onPress={confirmAndAddExpense}
            >
              <Check size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.retakeButton, { borderColor: theme.border }]}
              onPress={retakePhoto}
            >
              <Camera size={20} color={theme.textSecondary} />
              <Text style={[styles.retakeButtonText, { color: theme.textSecondary }]}>
                Retake Photo
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 20, backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.border }]}
            onPress={() => router.back()}
          >
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.imagePreviewContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/add-expense')}
            >
              <Text style={styles.previewButtonText}>Enter Details Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: theme.border }]}
              onPress={retakePhoto}
            >
              <Text style={[styles.previewButtonText, { color: theme.text }]}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={theme.text} style={styles.permissionIcon} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Camera Not Available
          </Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            Receipt scanning is not available on web. Please use the mobile app to scan receipts.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isCameraReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back' as CameraType}
      >
        <View style={styles.overlay}>
          <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.guideBorder} />
            <Text style={styles.guideText}>
              Position receipt within the frame
            </Text>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 40 }]}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingText}>Processing receipt...</Text>
              </View>
            ) : (
              <View style={styles.captureActions}>
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={pickImageFromGallery}
                >
                  <ImageIcon size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <View style={styles.galleryButtonPlaceholder} />
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBar: {
    padding: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  guideBorder: {
    width: '90%',
    height: 300,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  bottomBar: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  dataCard: {
    backgroundColor: 'rgba(30, 64, 175, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  dataRow: {
    marginBottom: 20,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemsList: {
    marginTop: 6,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewActions: {
    width: '100%',
    gap: 12,
  },
  previewButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  captureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonPlaceholder: {
    width: 56,
    height: 56,
  },
});
