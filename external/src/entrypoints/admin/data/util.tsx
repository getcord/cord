import { replaceAll } from 'common/util/index.ts';

export const capitalize = (text: string) =>
  replaceAll(text, '_', ' ')
    .split(' ')
    .filter((s) => s.length > 0)
    .map((word) => word[0].toUpperCase() + word.substr(1))
    .join(' ');
