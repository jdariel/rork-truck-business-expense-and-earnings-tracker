import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';


export default function DebugBackendScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    }
    if (process.env.EXPO_PUBLIC_BASE_URL) {
      return process.env.EXPO_PUBLIC_BASE_URL;
    }
    return "";
  };

  const testHealth = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const baseUrl = getBaseUrl();
      console.log('[Debug] Testing health at:', `${baseUrl}/api/health`);
      
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();
      
      setTestResult({
        success: true,
        status: response.status,
        data,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const testTRPC = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const baseUrl = getBaseUrl();
      console.log('[Debug] Testing tRPC at:', `${baseUrl}/api/trpc/example.hi`);
      
      const response = await fetch(`${baseUrl}/api/trpc/example.hi`, {
        method: 'GET',
      });
      
      const text = await response.text();
      console.log('[Debug] tRPC response:', text);
      
      setTestResult({
        success: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: text.substring(0, 500),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const testReceipt = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const baseUrl = getBaseUrl();
      console.log('[Debug] Testing receipt at:', `${baseUrl}/api/test-receipt`);
      
      const response = await fetch(`${baseUrl}/api/test-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: 'test',
        }),
      });
      
      const data = await response.json();
      
      setTestResult({
        success: true,
        status: response.status,
        data,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Backend Debug</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Environment</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Base URL: {getBaseUrl() || '(not set)'}
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Has RORK_API_BASE_URL: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Has BASE_URL: {process.env.EXPO_PUBLIC_BASE_URL ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tests</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={testHealth}
            disabled={testing}
          >
            <Text style={styles.buttonText}>Test Health Endpoint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={testTRPC}
            disabled={testing}
          >
            <Text style={styles.buttonText}>Test tRPC Endpoint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={testReceipt}
            disabled={testing}
          >
            <Text style={styles.buttonText}>Test Receipt Test Endpoint</Text>
          </TouchableOpacity>
        </View>

        {testing && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary, textAlign: 'center', marginTop: 12 }]}>
              Testing...
            </Text>
          </View>
        )}

        {testResult && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Result</Text>
            <View style={[styles.resultBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.resultText, { color: theme.textSecondary }]}>
                {JSON.stringify(testResult, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
