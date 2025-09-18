export type Appointment = {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  phone?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type DayCount = {
  date: string; // YYYY-MM-DD
  count: number;
};
