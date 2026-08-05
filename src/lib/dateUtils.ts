export function getLocalTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthStr(dateStr: string): string {
  // Returns YYYY-MM from YYYY-MM-DD
  return dateStr.substring(0, 7);
}

/**
 * Checks if a target date and meal type is past the configured cutoff time.
 * If targetDate is in the past relative to today, returns true.
 * If targetDate is in the future relative to today, returns false.
 * If targetDate is today, compares the current hours/minutes to the cutoff hours/minutes.
 * 
 * @param cutoffTimeStr Format "HH:MM" (24-hour, e.g. "18:00")
 * @param targetDateStr Format "YYYY-MM-DD"
 */
export function isPastCutoff(cutoffTimeStr: string, targetDateStr: string): boolean {
  const todayStr = getLocalTodayStr();
  
  if (targetDateStr < todayStr) {
    return true;
  }
  if (targetDateStr > todayStr) {
    return false;
  }
  
  // Parse cutoff HH:MM
  const [cutoffHours, cutoffMinutes] = cutoffTimeStr.split(':').map(Number);
  
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  if (currentHours > cutoffHours) {
    return true;
  }
  if (currentHours === cutoffHours && currentMinutes >= cutoffMinutes) {
    return true;
  }
  
  return false;
}
