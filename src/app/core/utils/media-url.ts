import { environment } from '../../../environments/environment';

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${environment.apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
}
