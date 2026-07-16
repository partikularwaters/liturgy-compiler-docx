export function parseLocalDate(dateInputValue: string): Date {
  const [year, month, day] = dateInputValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function getLordsDayNumber(date: Date): number {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const firstSundayOffset = (7 - jan1.getDay()) % 7;
  const daysSinceJan1 = Math.round((date.getTime() - jan1.getTime()) / 86_400_000);

  if (daysSinceJan1 < firstSundayOffset) return 1;
  return Math.floor((daysSinceJan1 - firstSundayOffset) / 7) + 1;
}
