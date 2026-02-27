import { differenceInDays, addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { DailyProgress, UserSettings } from '../types';

export const calculateTotalDays = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  // +1 because both start and end dates are inclusive
  return differenceInDays(endDate, startDate) + 1;
};

export const generateInitialLogs = (settings: UserSettings): DailyProgress[] => {
  const totalDays = calculateTotalDays(settings.startDate, settings.endDate);
  const totalJuz = settings.targetKhatam * 30;
  const targetPerDay = totalJuz / totalDays;

  return Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(new Date(settings.startDate), i);
    return {
      dayNumber: i + 1,
      date: format(date, 'yyyy-MM-dd'),
      juzRead: 0,
      targetJuz: targetPerDay,
    };
  });
};

export const getStatus = (currentTotal: number, targetTotal: number) => {
  const diff = currentTotal - targetTotal;
  if (diff >= 0.1) return 'Lebih Cepat';
  if (diff <= -0.1) return 'Tertinggal';
  return 'On Track';
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Lebih Cepat': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'Tertinggal': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const calculateDynamicTarget = (
  totalJuz: number,
  currentTotalRead: number,
  remainingDays: number
) => {
  if (remainingDays <= 0) return 0;
  const remainingJuz = Math.max(0, totalJuz - currentTotalRead);
  return remainingJuz / remainingDays;
};
