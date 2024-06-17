import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { cssVariableFallbacks } from 'common/ui/cssVariables.ts';

const keys = Object.keys(cssVariableFallbacks) as CSSVariable[];

export function findCSSVariablesByKeyword(
  keyword: string,
  filterKeywords?: string[],
): CSSVariable[] {
  let list = keys.filter((key) => key.includes(keyword));
  if (filterKeywords) {
    // Yes, this is inefficient and it matters about as much as a
    // tear drop in the ocean.
    for (const filterKeyword of filterKeywords) {
      list = list.filter((key) => !key.includes(filterKeyword));
    }
  }
  return list;
}
