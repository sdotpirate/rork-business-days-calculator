import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ArrowRight, Briefcase, Sun, TreePine, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { calculateBusinessDays, type BusinessDaysResult } from '@/constants/holidays';
import CalendarPicker from '@/components/CalendarPicker';
import { useEmbedMode, postResultToParent } from '@/hooks/useEmbedMode';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isEmbed = useEmbedMode();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [result, setResult] = useState<BusinessDaysResult | null>(null);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;

  const canCalculate = useMemo(() => {
    if (!startDate || !endDate) return false;
    return endDate >= startDate;
  }, [startDate, endDate]);

  const handleCalculate = useCallback(() => {
    if (!startDate || !endDate) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const res = calculateBusinessDays(startDate, endDate);
    setResult(res);
    console.log('Calculation result:', res);

    postResultToParent({
      businessDays: res.businessDays,
      totalCalendarDays: res.totalCalendarDays,
      weekendDays: res.weekendDays,
      holidays: res.holidaysInRange.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    resultAnim.setValue(0);
    counterAnim.setValue(0);

    Animated.sequence([
      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(counterAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [startDate, endDate, resultAnim, counterAnim]);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStartDate(null);
    setEndDate(null);
    setResult(null);
    resultAnim.setValue(0);
    counterAnim.setValue(0);
  }, [resultAnim, counterAnim]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      if (pickerTarget === 'start') {
        setStartDate(date);
        if (endDate && date > endDate) {
          setEndDate(null);
        }
      } else {
        setEndDate(date);
      }
      setResult(null);
      setPickerTarget(null);
    },
    [pickerTarget, endDate]
  );

  useEffect(() => {
    if (startDate && endDate && canCalculate) {
      handleCalculate();
    }
  }, [startDate, endDate, canCalculate, handleCalculate]);

  return (
    <View style={[styles.screen, !isEmbed && { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          isEmbed ? styles.embedContent : styles.content,
          !isEmbed && { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isEmbed && (
          <View style={styles.heroSection}>
            <View style={styles.iconRow}>
              <View style={styles.heroIcon}>
                <Briefcase size={22} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.heroTitle}>Business Days</Text>
            <Text style={styles.heroSubtitle}>
              Calculate working days between two dates,{'\n'}excluding weekends & major US holidays.
            </Text>
          </View>
        )}
        {isEmbed && (
          <Text style={styles.embedTitle}>Business Days Calculator</Text>
        )}

        <View style={styles.dateSection}>
          <TouchableOpacity
            style={[styles.dateCard, startDate && styles.dateCardActive]}
            onPress={() => setPickerTarget('start')}
            activeOpacity={0.7}
            testID="start-date-picker"
          >
            <Text style={styles.dateLabel}>Start Date</Text>
            {startDate ? (
              <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
            ) : (
              <Text style={styles.datePlaceholder}>Select date</Text>
            )}
            <Calendar size={18} color={startDate ? colors.primary : colors.textTertiary} style={styles.dateIcon} />
          </TouchableOpacity>

          <View style={styles.arrowContainer}>
            <ArrowRight size={18} color={colors.textTertiary} />
          </View>

          <TouchableOpacity
            style={[styles.dateCard, endDate && styles.dateCardActive]}
            onPress={() => setPickerTarget('end')}
            activeOpacity={0.7}
            testID="end-date-picker"
          >
            <Text style={styles.dateLabel}>End Date</Text>
            {endDate ? (
              <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
            ) : (
              <Text style={styles.datePlaceholder}>Select date</Text>
            )}
            <Calendar size={18} color={endDate ? colors.primary : colors.textTertiary} style={styles.dateIcon} />
          </TouchableOpacity>
        </View>

        {startDate && endDate && !canCalculate && (
          <Text style={styles.errorText}>End date must be on or after start date</Text>
        )}

        {result && (
          <Animated.View
            style={[
              styles.resultSection,
              {
                opacity: resultAnim,
                transform: [
                  {
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.bigNumberCard,
                {
                  opacity: counterAnim,
                  transform: [
                    {
                      scale: counterAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.05, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.bigNumber}>{result.businessDays}</Text>
              <Text style={styles.bigNumberLabel}>Business Days</Text>
            </Animated.View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Calendar size={16} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{result.totalCalendarDays}</Text>
                <Text style={styles.statLabel}>Calendar Days</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Sun size={16} color="#EA580C" />
                </View>
                <Text style={styles.statValue}>{result.weekendDays}</Text>
                <Text style={styles.statLabel}>Weekend Days</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.holidayLight }]}>
                  <TreePine size={16} color={colors.holiday} />
                </View>
                <Text style={styles.statValue}>{result.holidaysInRange.length}</Text>
                <Text style={styles.statLabel}>Holidays</Text>
              </View>
            </View>

            {result.holidaysInRange.length > 0 && (
              <View style={styles.holidayList}>
                <Text style={styles.holidayListTitle}>Holidays in Range</Text>
                {result.holidaysInRange.map((h, i) => (
                  <View key={`${h.name}-${i}`} style={styles.holidayItem}>
                    <View style={styles.holidayDot} />
                    <Text style={styles.holidayName}>{h.name}</Text>
                    <Text style={styles.holidayDate}>{formatShortDate(h.date)}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
              <RotateCcw size={16} color={colors.textSecondary} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isEmbed && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Holidays We Observe</Text>
            <View style={styles.infoGrid}>
              {[
                "New Year's Day",
                'Memorial Day',
                'Independence Day',
                'Labor Day',
                'Thanksgiving',
                'Christmas Day',
              ].map((name) => (
                <View key={name} style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{name}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.infoNote}>
              When a holiday falls on a weekend, the observed weekday is used.
            </Text>
          </View>
        )}
        {isEmbed && result && (
          <View style={styles.embedFooter}>
            <Text style={styles.embedFooterText}>
              Excludes weekends & major US holidays
            </Text>
          </View>
        )}
      </ScrollView>

      <CalendarPicker
        visible={pickerTarget !== null}
        selectedDate={pickerTarget === 'start' ? startDate : endDate}
        onSelect={handleDateSelect}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === 'start' ? 'Select Start Date' : 'Select End Date'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  embedContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
  embedTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  embedFooter: {
    marginTop: 8,
    alignItems: 'center' as const,
  },
  embedFooterText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 28,
  },
  iconRow: {
    marginBottom: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  dateCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  datePlaceholder: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  dateIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  arrowContainer: {
    width: 28,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  resultSection: {
    marginTop: 24,
  },
  bigNumberCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  bigNumberLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  holidayList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  holidayListTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holidayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.holiday,
    marginRight: 10,
  },
  holidayName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  holidayDate: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500' as const,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    marginBottom: 12,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  infoSection: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  infoChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.primaryDark,
  },
  infoNote: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
