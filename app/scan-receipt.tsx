import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, X, Sparkles, ImageIcon, ClipboardCheck, Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/theme-store';
import { useSubscription } from '@/hooks/subscription-store';
import { useBusiness } from '@/hooks/business-store';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { ExpenseCategory } from '@/types/business';
import { trpc } from '@/lib/trpc';

type ReceiptData = {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  items?: string[];
};

type ExpenseDraft = {
  merchant: string;
  amount: string;
  date: string;
  category: ExpenseCategory;
  notes: string;
};

const parseAmountValue = (value: string) => {
  const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { addExpense } = useBusiness();
  const { hasFeatureAccess, isLoading: subscriptionLoading } = useSubscription();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const permissionRequestInFlight = useRef(false);
  const scanMutation = trpc.receipt.scan.useMutation();

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
    if (!requestPermission) {
      return;
    }

    if (permission?.status === 'granted' || permission?.status === 'denied') {
      return;
    }

    if (permissionRequestInFlight.current) {
      return;
    }

    permissionRequestInFlight.current = true;
    console.log('Requesting camera permission...');

    requestPermission()
      .then(result => {
        console.log('Camera permission response:', result?.granted);
      })
      .catch(error => {
        console.error('Failed to request camera permission:', error);
        Alert.alert(
          'Camera Permission Error',
          'Unable to access the camera. Please enable permissions in your system settings.'
        );
      })
      .finally(() => {
        permissionRequestInFlight.current = false;
      });
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission?.granted) {
      setIsCameraReady(false);
    }
  }, [permission?.granted]);

  useEffect(() => {
    if (extractedData) {
      setExpenseDraft({
        merchant: extractedData.merchant,
        amount: extractedData.amount.toFixed(2),
        date: extractedData.date,
        category: extractedData.category,
        notes: extractedData.items?.join(', ') ?? '',
      });
    } else {
      setExpenseDraft(null);
    }
  }, [extractedData]);

  const handleCameraReady = useCallback(() => {
    console.log('Camera is ready');
    setIsCameraReady(true);
  }, []);

  const handleDraftChange = useCallback(<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => {
    setExpenseDraft(prev => (prev ? { ...prev, [key]: value } : prev));
  }, []);

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
    setExpenseDraft(null);
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

  const openManualEditor = () => {
    if (!expenseDraft) {
      return;
    }

    router.push({
      pathname: '/add-expense',
      params: {
        prefilledAmount: expenseDraft.amount,
        prefilledDescription: expenseDraft.merchant,
        prefilledCategory: expenseDraft.category,
        prefilledDate: expenseDraft.date,
        prefilledNotes: expenseDraft.notes,
      },
    });
  };

  const handleSaveExpense = async () => {
    if (!expenseDraft) {
      return;
    }

    const parsedAmount = parseAmountValue(expenseDraft.amount);
    if (!expenseDraft.merchant.trim() || parsedAmount <= 0) {
      Alert.alert('Missing Information', 'Please confirm the merchant name and amount before saving.');
      return;
    }

    const normalizedDate = expenseDraft.date?.trim() || new Date().toISOString().split('T')[0];

    setIsSavingExpense(true);
    console.log('Saving expense from receipt:', expenseDraft);
    try {
      await addExpense({
        date: normalizedDate,
        category: expenseDraft.category,
        amount: parsedAmount,
        description: expenseDraft.merchant.trim(),
        notes: expenseDraft.notes.trim() ? expenseDraft.notes.trim() : undefined,
        receiptImage: capturedImage ?? undefined,
      });

      retakePhoto();

      Alert.alert(
        'Expense Saved',
        'The scanned receipt has been added to your expenses.',
        [
          {
            text: 'View Reports',
            onPress: () => router.replace('/(tabs)/reports'),
          },
          {
            text: 'Close',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save expense from receipt:', error);
      Alert.alert('Save Failed', 'We could not save this expense. Please try again or edit manually.');
    } finally {
      setIsSavingExpense(false);
    }
  };

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
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Premium Feature</Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>Receipt scanning with AI is a premium feature. Upgrade to Rork Pro to automatically extract expense data from receipts.</Text>
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
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Go Back</Text>
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
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Permission Required</Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>We need access to your camera to scan receipts and extract expense data automatically.</Text>
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
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedImage) {
    if (extractedData && expenseDraft) {
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
          <ScrollView
            style={styles.resultsContainer}
            contentContainerStyle={styles.resultsContent}
            testID="receipt-results-scroll"
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.resultsHero}
            >
              <Sparkles size={32} color="#fff" />
              <Text style={styles.heroTitle}>Receipt scanned</Text>
              <Text style={styles.heroSubtitle}>Refine the AI data below or save instantly</Text>
            </LinearGradient>

            <View style={[styles.receiptCard, { backgroundColor: theme.card }]}> 
              <Image
                source={{ uri: capturedImage }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.retakeLink}
                onPress={retakePhoto}
                testID="retake-photo-button"
              >
                <Text style={styles.retakeLinkText}>Retake photo</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.dataCard, { backgroundColor: theme.surface }]}> 
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Merchant</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>{extractedData.merchant}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Amount</Text>
                <Text style={[styles.dataValue, { color: theme.success }]}>${extractedData.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Date</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>{new Date(extractedData.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {extractedData.category.charAt(0).toUpperCase() + extractedData.category.slice(1)}
                </Text>
              </View>
              {extractedData.items && extractedData.items.length > 0 && (
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Items</Text>
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

            <View style={[styles.editCard, { backgroundColor: theme.surface }]}> 
              <Text style={[styles.editTitle, { color: theme.text }]}>Fine tune before saving</Text>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Merchant / Description</Text>
                <TextInput
                  value={expenseDraft.merchant}
                  onChangeText={text => handleDraftChange('merchant', text)}
                  style={[styles.textField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                  placeholder="Merchant name"
                  placeholderTextColor={theme.textSecondary}
                  testID="receipt-merchant-input"
                />
              </View>

              <View style={styles.editRow}>
                <View style={styles.editFieldHalf}>
                  <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Amount</Text>
                  <TextInput
                    value={expenseDraft.amount}
                    onChangeText={text => handleDraftChange('amount', text)}
                    style={[styles.textField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary}
                    testID="receipt-amount-input"
                  />
                </View>
                <View style={styles.editFieldHalf}>
                  <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Date</Text>
                  <TextInput
                    value={expenseDraft.date}
                    onChangeText={text => handleDraftChange('date', text)}
                    style={[styles.textField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    testID="receipt-date-input"
                  />
                </View>
              </View>

              <Text style={[styles.editLabel, styles.chipLabel, { color: theme.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}> 
                {EXPENSE_CATEGORIES.map(categoryOption => (
                  <TouchableOpacity
                    key={categoryOption.value}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          expenseDraft.category === categoryOption.value ? theme.primary : 'transparent',
                        borderColor:
                          expenseDraft.category === categoryOption.value ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => handleDraftChange('category', categoryOption.value as ExpenseCategory)}
                    testID={`receipt-category-${categoryOption.value}`}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color:
                            expenseDraft.category === categoryOption.value ? '#fff' : theme.textSecondary,
                        },
                      ]}
                    >
                      {categoryOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Notes</Text>
                <TextInput
                  value={expenseDraft.notes}
                  onChangeText={text => handleDraftChange('notes', text)}
                  style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                  placeholder="Line items, context, etc."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  testID="receipt-notes-input"
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.actionsContainer, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.success }]}
              onPress={handleSaveExpense}
              disabled={isSavingExpense}
              testID="save-expense-button"
            >
              {isSavingExpense ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ClipboardCheck size={20} color="#fff" />
              )}
              <Text style={styles.confirmButtonText}>
                {isSavingExpense ? 'Saving...' : 'Save to Expenses'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.retakeButton, { borderColor: theme.border }]}
              onPress={openManualEditor}
              testID="edit-manually-button"
            >
              <Edit3 size={20} color={theme.textSecondary} />
              <Text style={[styles.retakeButtonText, { color: theme.textSecondary }]}>Open full editor</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Not Available</Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>Receipt scanning is not available on web. Please use the mobile app to scan receipts.</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="scan-receipt-screen"> 
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back' as CameraType}
        onCameraReady={handleCameraReady}
      >
        {!isCameraReady && (
          <View style={styles.cameraLoadingOverlay} testID="camera-loading-overlay">
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Initializing camera...</Text>
          </View>
        )}
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
            <Text style={styles.guideText}>Position receipt within the frame</Text>
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
                  testID="open-gallery-button"
                >
                  <ImageIcon size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  testID="capture-receipt-button"
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
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  },
  resultsContent: {
    padding: 20,
    paddingBottom: 140,
  },
  resultsHero: {
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  receiptCard: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  receiptImage: {
    width: '100%',
    height: 220,
  },
  retakeLink: {
    padding: 16,
    alignItems: 'center',
  },
  retakeLinkText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  dataCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  dataRow: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 13,
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
  editCard: {
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editField: {
    gap: 8,
  },
  editFieldHalf: {
    flex: 1,
    gap: 8,
  },
  editRow: {
    flexDirection: 'row',
    gap: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  textField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  chipLabel: {
    marginTop: 4,
  },
  chipRow: {
    gap: 10,
    marginVertical: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
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
