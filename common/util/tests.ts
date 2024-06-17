import dayjs from 'dayjs';

export const after = (dateISO: string): string =>
  dayjs(dateISO).add(1, 'm').toISOString();

export const before = (dateISO: string): string =>
  dayjs(dateISO).subtract(1, 'm').toISOString();

export const documentFromHTML = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

export function documentWithTitle(title: string) {
  title = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return documentFromHTML(`<html><head><title>${title}</title></head></html>`);
}
