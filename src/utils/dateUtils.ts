export function getTodayDateString(): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date().toLocaleDateString('en-US', options);
}

export function formatDateString(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr);
  return d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
}

export function isUpcoming(dateStr: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const d = new Date(dateStr);
  return d.getTime() > today.getTime();
}

export function isOverdue(dateStr: string, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  return d.getTime() < todayStart.getTime();
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}
