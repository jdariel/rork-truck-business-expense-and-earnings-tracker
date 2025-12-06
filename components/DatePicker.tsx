import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from "react-native";
import { useState } from "react";
import { Calendar, X } from "lucide-react-native";
import { useTheme } from "@/hooks/theme-store";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getCurrentMonthYear = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getDaysInMonth = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDayPress = (day: number | null) => {
    if (!day) return;
    
    const date = new Date(selectedDate + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();
    const newDate = new Date(year, month, day);
    const formatted = newDate.toISOString().split('T')[0];
    setSelectedDate(formatted);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setShowPicker(false);
  };

  const handlePrevMonth = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setMonth(date.getMonth() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const isSelectedDay = (day: number | null) => {
    if (!day) return false;
    const date = new Date(selectedDate + 'T00:00:00');
    return date.getDate() === day;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const date = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           day === today.getDate();
  };

  return (
    <View>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.dateInput, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setShowPicker(true)}
      >
        <Calendar size={20} color={theme.textSecondary} />
        <Text style={[styles.dateText, { color: theme.text }]}>
          {formatDisplayDate(value)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
                <Text style={[styles.monthButtonText, { color: theme.primary }]}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: theme.text }]}>
                {getCurrentMonthYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                <Text style={[styles.monthButtonText, { color: theme.primary }]}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={[styles.weekDay, { color: theme.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {getDaysInMonth().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day === null && styles.emptyCell,
                    isSelectedDay(day) && { backgroundColor: theme.primary },
                    isToday(day) && !isSelectedDay(day) && { borderWidth: 2, borderColor: theme.primary },
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={day === null}
                >
                  {day !== null && (
                    <Text style={[
                      styles.dayText,
                      { color: theme.text },
                      isSelectedDay(day) && styles.selectedDayText,
                    ]}>
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: theme.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  emptyCell: {
    opacity: 0,
  },
  dayText: {
    fontSize: 16,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  confirmButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
