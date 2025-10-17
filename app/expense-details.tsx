import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert, Modal } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { Calendar, Trash2, X, Edit } from "lucide-react-native";

export default function ExpenseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, deleteExpense } = useBusiness();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  const expense = expenses.find(e => e.id === id);

  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
  const dateObj = new Date(expense.date + 'T00:00:00');

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteExpense(expense.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Expense Details",
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.push(`/edit-expense?id=${expense.id}`)}>
                <Edit size={22} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Trash2 size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(expense.amount)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>{category?.icon}</Text>
              <Text style={styles.categoryText}>{category?.label}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.dateContainer}>
              <Calendar size={18} color="#6b7280" />
              <Text style={styles.dateText}>
                {dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{expense.description}</Text>
          </View>

          {expense.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          )}

          {expense.receiptImage && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Receipt Photo</Text>
              <TouchableOpacity 
                style={styles.receiptContainer}
                onPress={() => setImageModalVisible(true)}
              >
                <Image 
                  source={{ uri: expense.receiptImage }} 
                  style={styles.receiptImage}
                  resizeMode="cover"
                />
                <View style={styles.receiptOverlay}>
                  <Text style={styles.receiptOverlayText}>Tap to view full size</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaSection}>
            <Text style={styles.metaText}>
              Created: {new Date(expense.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          <Image 
            source={{ uri: expense.receiptImage }} 
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  amountCard: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#fee2e2',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
  },
  descriptionText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  receiptContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    alignItems: 'center',
  },
  receiptOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  metaSection: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
