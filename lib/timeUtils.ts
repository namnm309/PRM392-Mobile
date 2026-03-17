import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return 'Vừa xong';

    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return '';
  }
}
