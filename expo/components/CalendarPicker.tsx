import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { getHolidaysForYear } from '@/constants/holidays';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarPickerProps {
  visible: boolean;
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
  title: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPicker({
  visible,
  selectedDate,
  onSelect,
  onClose,
  title,
}: CalendarPickerProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    if (visible) {
      if (selectedDate) {
        setViewYear(selectedDate.getFullYear());
        setViewMonth(selectedDate.getMonth());
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, selectedDate, fadeAnim]);

  const holidays = useMemo(() => getHolidaysForYear(viewYear), [viewYear]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleSelect = useCallback(
    (day: number) => {
      onSelect(new Date(viewYear, viewMonth, day));
    },
    [viewYear, viewMonth, onSelect]
  );

  const isHolidayDay = useCallback(
    (day: number) => {
      const date = new Date(viewYear, viewMonth, day);
      return holidays.some((h) => isSameDay(h.date, date));
    },
    [viewYear, viewMonth, holidays]
  );

  const isWeekendIndex = useCallback((dayIndex: number) => {
    return dayIndex % 7 === 0 || dayIndex % 7 === 6;
  }, []);

  const cellWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.min((screenWidth - 80) / 7, 48);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {DAYS.map((d, i) => (
              <View key={d} style={[styles.weekCell, { width: cellWidth }]}>
                <Text
                  style={[
                    styles.weekLabel,
                    (i === 0 || i === 6) && { color: colors.weekend },
                  ]}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={[styles.dayCell, { width: cellWidth, height: cellWidth }]} />;
              }

              const date = new Date(viewYear, viewMonth, day);
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);
              const holiday = isHolidayDay(day);
              const weekend = isWeekendIndex(index);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    { width: cellWidth, height: cellWidth },
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => handleSelect(day)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.dayText,
                      weekend && { color: colors.weekend },
                      holiday && { color: colors.holiday },
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayDayText,
                    ]}
                  >
                    {day}
                  </Text>
                  {holiday && !isSelected && <View style={styles.holidayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.holiday }]} />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.weekend }]} />
              <Text style={styles.legendText}>Weekend</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  weekCell: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  todayDay: {
    backgroundColor: colors.primaryLight,
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.holiday,
    position: 'absolute',
    bottom: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
