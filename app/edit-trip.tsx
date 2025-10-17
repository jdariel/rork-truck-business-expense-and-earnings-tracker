import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import { Check, Calendar } from "lucide-react-native";

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, updateTrip, routes, getRouteByName } = useBusiness();
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const trip = trips.find(t => t.id === id);

  const [routeName, setRouteName] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");
  const [earnings, setEarnings] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (trip) {
      setRouteName(trip.routeName);
      setTrailerNumber(trip.trailerNumber || "");
      setEarnings(trip.earnings.toString());
      setFuelCost(trip.fuelCost?.toString() || "");
      setOtherExpenses(trip.otherExpenses?.toString() || "");
      setNotes(trip.notes || "");
      setDate(trip.date);
    }
  }, [trip]);

  useEffect(() => {
    if (routeName.length > 0) {
      const filtered = routes
        .filter(route => route.name.toLowerCase().includes(routeName.toLowerCase()))
        .map(route => route.name)
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [routeName, routes]);

  const handleRouteSelect = (name: string) => {
    setRouteName(name);
    setSuggestions([]);
    
    const route = getRouteByName(name);
    if (route) {
      setEarnings(route.payment.toString());
    }
  };

  const handleSubmit = async () => {
    if (!trip) {
      Alert.alert("Error", "Trip not found");
      return;
    }

    if (!routeName) {
      Alert.alert("Error", "Please enter route name");
      return;
    }
    
    if (!earnings) {
      Alert.alert("Error", "Please enter earnings amount");
      return;
    }

    await updateTrip(trip.id, {
      routeName,
      date,
      earnings: parseFloat(earnings),
      trailerNumber: trailerNumber || undefined,
      fuelCost: fuelCost ? parseFloat(fuelCost) : undefined,
      otherExpenses: otherExpenses ? parseFloat(otherExpenses) : undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  if (!trip) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Trip" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorText, { color: theme.text }]}>Trip not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Trip" }} />
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
            <Text style={[styles.label, { color: theme.text }]}>Route Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter route name"
              value={routeName}
              onChangeText={setRouteName}
              placeholderTextColor={theme.textSecondary}
            />
            {suggestions.length > 0 && (
              <View style={[styles.suggestions, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleRouteSelect(suggestion)}
                  >
                    <Text style={[styles.suggestionText, { color: theme.text }]}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Trailer Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter trailer number"
              value={trailerNumber}
              onChangeText={setTrailerNumber}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Earnings *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={earnings}
              onChangeText={setEarnings}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Fuel Cost</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={fuelCost}
              onChangeText={setFuelCost}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Other Expenses</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={otherExpenses}
              onChangeText={setOtherExpenses}
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
            <Text style={styles.submitButtonText}>Update Trip</Text>
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
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#1f2937',
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
