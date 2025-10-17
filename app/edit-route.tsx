import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import { Check } from "lucide-react-native";

export default function EditRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routes, updateRoute } = useBusiness();
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const route = routes.find(r => r.id === id);

  const [name, setName] = useState("");
  const [payment, setPayment] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (route) {
      setName(route.name);
      setPayment(route.payment.toString());
      setDistance(route.distance?.toString() || "");
      setNotes(route.notes || "");
    }
  }, [route]);

  const handleSubmit = async () => {
    if (!route) {
      Alert.alert("Error", "Route not found");
      return;
    }

    if (!name || !payment) {
      Alert.alert("Error", "Please fill in route name and payment");
      return;
    }

    await updateRoute(route.id, {
      name,
      payment: parseFloat(payment),
      distance: distance ? parseFloat(distance) : undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  if (!route) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Route" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorText, { color: theme.text }]}>Route not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Route" }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Route Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter route name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Payment Amount *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={payment}
              onChangeText={setPayment}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Distance (miles)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Add any notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor={theme.textSecondary}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Check size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Update Route</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    padding: 16,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
