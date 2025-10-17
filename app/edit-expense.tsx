import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { ExpenseCategory } from "@/types/business";
import { Check, Calendar, X } from "lucide-react-native";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, updateExpense } = useBusiness();
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const expense = expenses.find(e => e.id === id);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [receiptImage, setReceiptImage] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setCategory(expense.category);
      setNotes(expense.notes || "");
      setDate(expense.date);
      setReceiptImage(expense.receiptImage || "");
    }
  }, [expense]);

  const handleSubmit = async () => {
    if (!expense) {
      Alert.alert("Error", "Expense not found");
      return;
    }

    if (!description || !amount) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    await updateExpense(expense.id, {
      description,
      amount: parseFloat(amount),
      category,
      date,
      notes: notes || undefined,
      receiptImage: receiptImage || undefined,
    });

    router.back();
  };

  if (!expense) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Expense" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorText, { color: theme.text }]}>Expense not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Expense" }} />
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
            <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
            <View style={[styles.dateInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Calendar size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.dateText, { color: theme.text }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    category === cat.value && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    { color: theme.text },
                    category === cat.value && styles.categoryTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="What was this expense for?"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Amount *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
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

          {receiptImage && (
            <View style={styles.inputGroup}>
              <View style={styles.receiptHeader}>
                <Text style={[styles.label, { color: theme.text }]}>Receipt Image</Text>
                <TouchableOpacity onPress={() => setReceiptImage("")}>
                  <X size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Image 
                source={{ uri: receiptImage }} 
                style={styles.receiptImage}
                resizeMode="cover"
              />
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Check size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Update Expense</Text>
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    borderColor: '#1e40af',
    backgroundColor: '#eff6ff',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
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
