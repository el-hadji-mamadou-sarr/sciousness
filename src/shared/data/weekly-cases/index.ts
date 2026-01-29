import { WeeklyCase } from '../../types/game';
import { week001Case } from './week001';

// All available weekly cases
export const WEEKLY_CASES: WeeklyCase[] = [
  week001Case,
];

/**
 * Get the current week's case based on the week number of the year.
 * Cases rotate through the available pool.
 */
export function getCurrentWeeklyCase(): WeeklyCase | null {
  if (WEEKLY_CASES.length === 0) {
    return null;
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Mon, 7=Sun

  // Calculate Monday of this week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (adjustedDay - 1));

  // Calculate week number
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7);

  // Select case based on week number (rotating through available cases)
  const caseIndex = weekNumber % WEEKLY_CASES.length;
  return WEEKLY_CASES[caseIndex] || null;
}

/**
 * Get info about the current week
 */
export function getCurrentWeekInfo(): {
  weekNumber: number;
  startDate: string;
  dayOfWeek: number;
} {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() - (adjustedDay - 1));

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7);

  return {
    weekNumber,
    startDate: monday.toISOString().split('T')[0] || '',
    dayOfWeek: adjustedDay,
  };
}
