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
import * as ImageManipulator from 'expo-image-manipulator';
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
  const insets = useSafeAreaInsets();
  const { addExpense } = useBusiness();
  const { hasFeatureAccess, isLoading: subscriptionLoading } = useSubscription();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const permissionRequestInFlight = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft | null>(null);

  const scanMutation = trpc.receipt.scan.useMutation();
  const hasAccess = !subscriptionLoading && hasFeatureAccess('receiptScanner');

  //--------------------------------------------------------------------
  // Lifecycle Logging
  //--------------------------------------------------------------------
  useEffect(() => {
    console.log('[ScanReceipt] Mounted');
    console.log('[ScanReceipt] Permission:', permission?.granted);
    console.log('[ScanReceipt] Has access:', hasAccess);
    console.log('[ScanReceipt] Subscription loading:', subscriptionLoading);
    return () => console.log('[ScanReceipt] Unmounted');
  }, [hasAccess, permission?.granted, subscriptionLoading]);

  //--------------------------------------------------------------------
  // Permission Handling
  //--------------------------------------------------------------------
  useEffect(() => {
    if (!requestPermission || !permission) return;
    if (permission.status === 'granted' || permission.status === 'denied') return;
    if (permissionRequestInFlight.current) return;

    permissionRequestInFlight.current = true;
    console.log('[ScanReceipt] Requesting camera permission...');

    requestPermission()
      .then(result => console.log('[ScanReceipt] Permission granted:', result?.granted))
      .catch(error => {
        console.error('[ScanReceipt] Permission error:', error);
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
    if (permission?.granted) setCameraReady(false);
  }, [permission?.granted]);

  //--------------------------------------------------------------------
  // Sync Draft from Extracted Data
  //--------------------------------------------------------------------
  useEffect(() => {
    if (receiptData) {
      setExpenseDraft({
        merchant: receiptData.merchant,
        amount: receiptData.amount.toFixed(2),
        date: receiptData.date,
        category: receiptData.category,
        notes: receiptData.items?.join(', ') ?? '',
      });
    } else {
      setExpenseDraft(null);
    }
  }, [receiptData]);

  //--------------------------------------------------------------------
  // Camera Ready Callback
  //--------------------------------------------------------------------
  const handleCameraReady = useCallback(() => {
    console.log('[ScanReceipt] Camera ready');
    setCameraReady(true);
  }, []);

  //--------------------------------------------------------------------
  // Draft Field Updates
  //--------------------------------------------------------------------
  const handleDraftChange = useCallback(<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => {
    setExpenseDraft(prev => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  //--------------------------------------------------------------------
  // Compress Image
  //--------------------------------------------------------------------
  const compressImage = async (uri: string): Promise<{ uri: string; base64: string }> => {
    console.log('[ScanReceipt] Compressing image...');
    
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (!manipResult.base64) {
      throw new Error('Failed to generate base64 from compressed image');
    }

    console.log('[ScanReceipt] Compressed - Original URI length:', uri.length, '| Base64 length:', manipResult.base64.length);
    
    return {
      uri: manipResult.uri,
      base64: manipResult.base64,
    };
  };

  //--------------------------------------------------------------------
  // Take Picture
  //--------------------------------------------------------------------
  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log('[ScanReceipt] Camera ref is null');
      return;
    }

    console.log('[ScanReceipt] Taking picture...');

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo) {
        Alert.alert('Error', 'Failed to capture image');
        setProcessing(false);
        return;
      }

      const compressed = await compressImage(photo.uri);
      setImageUri(compressed.uri);
      await processReceipt(compressed.base64);
    } catch (error) {
      console.error('[ScanReceipt] Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setProcessing(false);
    }
  };

  //--------------------------------------------------------------------
  // Process Receipt with AI
  //--------------------------------------------------------------------
  const processReceipt = async (base64Image: string) => {
    try {
      console.log('[ScanReceipt] Processing with AI... (image length:', base64Image.length, ')');

      const result = await scanMutation.mutateAsync({ base64Image });
      console.log('[ScanReceipt] Success:', result);
      console.log('[ScanReceipt] Result type:', typeof result);
      console.log('[ScanReceipt] Result keys:', result ? Object.keys(result) : 'null');
      
      if (!result || typeof result !== 'object') {
        console.error('[ScanReceipt] Invalid result format:', result);
        throw new Error('Invalid response format from server');
      }
      
      setReceiptData(result);
      setProcessing(false);
    } catch (error: any) {
      console.error('[ScanReceipt] Error processing:', error);
      console.error('[ScanReceipt] Error type:', typeof error);
      console.error('[ScanReceipt] Error name:', error?.name);
      console.error('[ScanReceipt] Error message:', error?.message);
      console.error('[ScanReceipt] Error data:', error?.data);
      console.error('[ScanReceipt] Error cause:', error?.cause);
      console.error('[ScanReceipt] Full error:', JSON.stringify(error, null, 2));
      setProcessing(false);

      let errorTitle = 'Processing Failed';
      let errorMessage = 'Unable to extract data from the receipt.';
      
      if (error?.message?.includes('Backend not configured')) {
        errorTitle = 'Backend Not Configured';
        errorMessage = 'The backend server is not set up. Receipt scanning requires a backend service to process images with AI.\n\nPlease contact support or check your configuration.';
        
        Alert.alert(errorTitle, errorMessage, [
          {
            text: 'Enter Manually',
            onPress: () => router.push('/add-expense'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]);
        return;
      }
      
      if (error?.message?.includes('404') || error?.cause?.message?.includes('404') || error?.message?.includes('Not Found')) {
        errorTitle = 'Backend Not Deployed';
        errorMessage = 'The receipt scanning backend service is not deployed yet.\n\nThe backend code is ready in your project, but needs to be deployed to work. Please contact support or check your deployment status.\n\nIn the meantime, you can enter expenses manually.';
        
        Alert.alert(errorTitle, errorMessage, [
          {
            text: 'Enter Manually',
            onPress: () => router.push('/add-expense'),
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]);
        return;
      } else if (error?.message) {
        errorMessage += `\n\nError: ${error.message}`;
      }

      Alert.alert(
        errorTitle,
        errorMessage + '\n\nWould you like to enter the details manually?',
        [
          {
            text: 'Enter Manually',
            onPress: () => router.push('/add-expense'),
          },
          {
            text: 'Retake Photo',
            onPress: reset,
            style: 'cancel',
          },
        ]
      );
    }
  };

  //--------------------------------------------------------------------
  // Reset State
  //--------------------------------------------------------------------
  const reset = () => {
    setImageUri(null);
    setReceiptData(null);
    setExpenseDraft(null);
    setProcessing(false);
  };

  //--------------------------------------------------------------------
  // Pick from Gallery
  //--------------------------------------------------------------------
  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProcessing(true);
        
        const compressed = await compressImage(asset.uri);
        setImageUri(compressed.uri);
        await processReceipt(compressed.base64);
      }
    } catch (error) {
      console.error('[ScanReceipt] Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
      setProcessing(false);
    }
  };

  //--------------------------------------------------------------------
  // Open Full Editor
  //--------------------------------------------------------------------
  const openManualEditor = () => {
    if (!expenseDraft) return;

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

  //--------------------------------------------------------------------
  // Save Expense
  //--------------------------------------------------------------------
  const handleSaveExpense = async () => {
    if (!expenseDraft) return;

    const parsedAmount = parseAmountValue(expenseDraft.amount);
    if (!expenseDraft.merchant.trim() || parsedAmount <= 0) {
      Alert.alert('Missing Information', 'Please confirm the merchant name and amount before saving.');
      return;
    }

    const normalizedDate = expenseDraft.date?.trim() || new Date().toISOString().split('T')[0];

    setSavingExpense(true);
    console.log('[ScanReceipt] Saving expense:', expenseDraft);
    
    try {
      await addExpense({
        date: normalizedDate,
        category: expenseDraft.category,
        amount: parsedAmount,
        description: expenseDraft.merchant.trim(),
        notes: expenseDraft.notes.trim() ? expenseDraft.notes.trim() : undefined,
        receiptImage: imageUri ?? undefined,
      });

      reset();

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
      console.error('[ScanReceipt] Save failed:', error);
      Alert.alert('Save Failed', 'We could not save this expense. Please try again or edit manually.');
    } finally {
      setSavingExpense(false);
    }
  };

  //--------------------------------------------------------------------
  // Render Conditions
  //--------------------------------------------------------------------
  if (subscriptionLoading) {
    return <LoadingScreen theme={theme} />;
  }

  if (!hasAccess) {
    return <PremiumBlockedScreen theme={theme} router={router} />;
  }

  if (!permission) {
    return <LoadingScreen theme={theme} />;
  }

  if (!permission.granted) {
    return <PermissionBlockedScreen theme={theme} requestPermission={requestPermission} router={router} />;
  }

  if (imageUri) {
    if (receiptData && expenseDraft) {
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
                source={{ uri: imageUri }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.retakeLink}
                onPress={reset}
                testID="retake-photo-button"
              >
                <Text style={styles.retakeLinkText}>Retake photo</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.dataCard, { backgroundColor: theme.surface }]}>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Merchant</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>{receiptData.merchant}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Amount</Text>
                <Text style={[styles.dataValue, { color: theme.success }]}>${receiptData.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Date</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>{new Date(receiptData.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {receiptData.category.charAt(0).toUpperCase() + receiptData.category.slice(1)}
                </Text>
              </View>
              {receiptData.items && receiptData.items.length > 0 && (
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Items</Text>
                  <View style={styles.itemsList}>
                    {receiptData.items.map((item, index) => (
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
              disabled={savingExpense}
              testID="save-expense-button"
            >
              {savingExpense ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ClipboardCheck size={20} color="#fff" />
              )}
              <Text style={styles.confirmButtonText}>
                {savingExpense ? 'Saving...' : 'Save to Expenses'}
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

    return <ImagePreviewScreen theme={theme} imageUri={imageUri} onRetake={reset} router={router} />;
  }

  if (Platform.OS === 'web') {
    return <WebBlockedScreen theme={theme} router={router} />;
  }

  //--------------------------------------------------------------------
  // Main Camera UI
  //--------------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="scan-receipt-screen">
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back' as CameraType}
        onCameraReady={handleCameraReady}
      >
        {!cameraReady && <CameraInitOverlay />}
        
        <View style={styles.overlay}>
          <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.guideBorder} />
            <Text style={styles.guideText}>Position receipt within the frame</Text>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 40 }]}>
            {processing ? (
              <ProcessingOverlay />
            ) : (
              <View style={styles.captureActions}>
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={pickFromGallery}
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

//--------------------------------------------------------------------
// Subcomponents
//--------------------------------------------------------------------
const LoadingScreen = ({ theme }: { theme: any }) => (
  <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
    <ActivityIndicator size="large" color={theme.primary} />
  </View>
);

const PremiumBlockedScreen = ({ theme, router }: { theme: any; router: any }) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={styles.permissionContainer}>
      <Sparkles size={64} color={theme.primary} style={styles.permissionIcon} />
      <Text style={[styles.permissionTitle, { color: theme.text }]}>Premium Feature</Text>
      <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
        Receipt scanning with AI is a premium feature. Upgrade to Rork Pro to automatically extract expense data from receipts.
      </Text>
      <TouchableOpacity
        style={[styles.permissionButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/upgrade')}
      >
        <Text style={styles.permissionButtonText}>Upgrade to Pro</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PermissionBlockedScreen = ({ theme, requestPermission, router }: { theme: any; requestPermission: any; router: any }) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={styles.permissionContainer}>
      <Camera size={64} color={theme.text} style={styles.permissionIcon} />
      <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Permission Required</Text>
      <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
        We need access to your camera to scan receipts and extract expense data automatically.
      </Text>
      <TouchableOpacity
        style={[styles.permissionButton, { backgroundColor: theme.primary }]}
        onPress={requestPermission}
      >
        <Text style={styles.permissionButtonText}>Grant Permission</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const WebBlockedScreen = ({ theme, router }: { theme: any; router: any }) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={styles.permissionContainer}>
      <Camera size={64} color={theme.text} style={styles.permissionIcon} />
      <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Not Available</Text>
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

const CameraInitOverlay = () => (
  <View style={styles.cameraLoadingOverlay} testID="camera-loading-overlay">
    <ActivityIndicator size="large" color="#fff" />
    <Text style={styles.processingText}>Initializing camera...</Text>
  </View>
);

const ProcessingOverlay = () => (
  <View style={styles.processingContainer}>
    <ActivityIndicator size="large" color="#fff" />
    <Text style={styles.processingText}>Processing receipt...</Text>
  </View>
);

const ImagePreviewScreen = ({ theme, imageUri, onRetake, router }: { theme: any; imageUri: string; onRetake: () => void; router: any }) => {
  const insets = useSafeAreaInsets();
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
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/add-expense')}
          >
            <Text style={styles.previewButtonText}>Enter Details Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: theme.border }]}
            onPress={onRetake}
          >
            <Text style={[styles.previewButtonText, { color: theme.text }]}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

//--------------------------------------------------------------------
// Styles
//--------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
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
