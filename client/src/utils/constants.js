export const SERVICE_TYPES = {
  PERIODIC: 'טיפול תקופתי',
  OIL: 'החלפת שמן',
  BRAKES: 'בלמים',
  TIRES: 'צמיגים',
  BATTERY: 'מצבר',
  TEST: 'טסט',
  AC: 'מיזוג אוויר',
  TIMING_BELT: 'רצועת טיימינג',
  FILTERS: 'פילטרים',
  SUSPENSION: 'מתלים',
  ELECTRICAL: 'חשמל',
  BODY_WORK: 'פחחות',
  GENERAL: 'כללי',
  OTHER: 'אחר',
};

export const EXPENSE_CATEGORIES = {
  FUEL: 'דלק',
  PARKING: 'חניה',
  FINE: 'דוח',
  INSURANCE: 'ביטוח',
  LICENSE: 'רישיון',
  TOLL: 'אגרה',
  WASH: 'שטיפה',
  ACCESSORIES: 'אביזרים',
  OTHER: 'אחר',
};

export const REMINDER_TYPES = {
  TEST: 'טסט',
  OIL: 'שמן',
  INSURANCE: 'ביטוח',
  LICENSE: 'רישיון',
  TIRES: 'צמיגים',
  BRAKES: 'בלמים',
  CUSTOM: 'מותאם אישית',
};

export const SERVICE_TYPE_ICONS = {
  PERIODIC: '🔄',
  OIL: '🛢️',
  BRAKES: '🔴',
  TIRES: '🔧',
  BATTERY: '🔋',
  TEST: '✅',
  AC: '❄️',
  TIMING_BELT: '⚙️',
  FILTERS: '🌬️',
  SUSPENSION: '🔩',
  ELECTRICAL: '⚡',
  BODY_WORK: '🔨',
  GENERAL: '🔧',
  OTHER: '📋',
};

export const EXPENSE_CATEGORY_ICONS = {
  FUEL: '⛽',
  PARKING: '🅿️',
  FINE: '📄',
  INSURANCE: '🛡️',
  LICENSE: '📝',
  TOLL: '🛣️',
  WASH: '🚿',
  ACCESSORIES: '🎯',
  OTHER: '📦',
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('he-IL');
}

export function formatNumber(num) {
  if (!num) return '-';
  return new Intl.NumberFormat('he-IL').format(num);
}
