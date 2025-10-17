import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from "react";
import { router } from "expo-router";
import { Plus, Search, MapPin, DollarSign, Trash2, Edit } from "lucide-react-native";
import { useBusiness, useRouteSearch } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import { Route } from "@/types/business";

export default function RoutesScreen() {
  const { addRoute, deleteRoute } = useBusiness();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: "",
    payment: "",
    distance: "",
    notes: "",
  });

  const filteredRoutes = useRouteSearch(searchTerm);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.payment) {
      Alert.alert("Error", "Please enter route name and payment amount");
      return;
    }

    await addRoute({
      name: newRoute.name,
      payment: parseFloat(newRoute.payment),
      distance: newRoute.distance ? parseFloat(newRoute.distance) : undefined,
      notes: newRoute.notes || undefined,
    });

    setNewRoute({ name: "", payment: "", distance: "", notes: "" });
    setShowAddForm(false);
  };

  const handleDeleteRoute = (route: Route) => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${route.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteRoute(route.id)
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search routes..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Route</Text>
        </TouchableOpacity>
      </View>

      {/* Add Route Form */}
      {showAddForm && (
        <View style={[styles.addForm, { backgroundColor: theme.card }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>New Route</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Route Name *"
            value={newRoute.name}
            onChangeText={(text) => setNewRoute({ ...newRoute, name: text })}
            placeholderTextColor={theme.textSecondary}
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Payment Amount *"
            value={newRoute.payment}
            onChangeText={(text) => setNewRoute({ ...newRoute, payment: text })}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Distance (miles)"
            value={newRoute.distance}
            onChangeText={(text) => setNewRoute({ ...newRoute, distance: text })}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
          />
          
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Notes"
            value={newRoute.notes}
            onChangeText={(text) => setNewRoute({ ...newRoute, notes: text })}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.textSecondary}
          />
          
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={() => {
                setShowAddForm(false);
                setNewRoute({ name: "", payment: "", distance: "", notes: "" });
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddRoute}
            >
              <Text style={styles.saveButtonText}>Save Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Routes List */}
      <ScrollView style={styles.list}>
        {filteredRoutes.map(route => (
          <TouchableOpacity
            key={route.id}
            style={[styles.routeCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/route-details?id=${route.id}`)}
          >
            <View style={styles.routeHeader}>
              <View style={styles.routeName}>
                <MapPin size={20} color="#1e40af" />
                <Text style={[styles.routeNameText, { color: theme.text }]}>{route.name}</Text>
              </View>
              <View style={styles.routeActions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-route?id=${route.id}`);
                  }}
                >
                  <Edit size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteRoute(route);
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.routeDetails}>
              <View style={styles.routeDetail}>
                <DollarSign size={16} color="#10b981" />
                <Text style={styles.routePayment}>{formatCurrency(route.payment)}</Text>
              </View>
              
              {route.distance && (
                <Text style={[styles.routeDistance, { color: theme.textSecondary }]}>{route.distance} miles</Text>
              )}
            </View>
            
            {route.notes && (
              <Text style={[styles.routeNotes, { color: theme.textSecondary }]} numberOfLines={2}>{route.notes}</Text>
            )}
          </TouchableOpacity>
        ))}

        {filteredRoutes.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No routes found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {searchTerm ? 'Try adjusting your search' : 'Add your first route to get started'}
            </Text>
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
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1e40af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeNameText: {
    fontSize: 18,
    fontWeight: '600',
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routePayment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  routeDistance: {
    fontSize: 14,
  },
  routeNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});