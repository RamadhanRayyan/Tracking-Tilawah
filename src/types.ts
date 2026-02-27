export interface DailyProgress {
  dayNumber: number;
  date: string;
  juzRead: number;
  targetJuz: number;
}

export interface UserSettings {
  username: string;
  startDate: string;
  endDate: string;
  targetKhatam: number;
}

export interface AppData {
  settings: UserSettings | null;
  dailyLogs: DailyProgress[];
}
