export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const ranges = [
    { limit: 60, label: "сек", divisor: 1 },
    { limit: 3600, label: "мин", divisor: 60 },
    { limit: 86400, label: "ч", divisor: 3600 },
    { limit: 604800, label: "дн", divisor: 86400 },
    { limit: 2629800, label: "нед", divisor: 604800 },
    { limit: 31557600, label: "мес", divisor: 2629800 },
  ];

  if (seconds < 10) return "только что";

  for (const range of ranges) {
    if (seconds < range.limit) {
      return `${Math.floor(seconds / range.divisor)} ${range.label} назад`;
    }
  }
  return `${Math.floor(seconds / 31557600)} г назад`;
}

export function formatClock(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatFullDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
