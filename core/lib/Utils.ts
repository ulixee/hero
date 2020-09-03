import { URL } from "url";

export function extractFileExtension(url: string, filetype: string) {
  const location = new URL(url);
  const matches = location.pathname.split('.');
  if (matches.length === 1 && filetype === 'document') return 'html';
  if (matches.length === 1) return 'text';
  return matches.pop().match(/([^/]+)$/)[1] || filetype;
}
