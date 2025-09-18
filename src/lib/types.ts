import type { DateKey } from '@/lib/utils/date';

export type Appointment = {
  id: number;
  date: DateKey;
  name: string;
  phone?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export type DayCount = {
  date: DateKey;
  count: number;
};

export type AppointmentCreateInput = {
  date: DateKey;
  name: string;
  phone?: string | null;
  notes?: string | null;
};
