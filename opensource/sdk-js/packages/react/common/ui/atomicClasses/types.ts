import type { CSSProperties } from 'react';

type PseudoProp = 'hover' | 'active' | 'disabled' | 'focus';
type PseudoKey = `&:${PseudoProp}`;

type CSSPropertyValue<K extends keyof CSSProperties> =
  | CSSProperties[K]
  | string;

export type Styles = {
  [K in keyof CSSProperties]?: CSSPropertyValue<K>;
} & {
  [P in PseudoKey]?: { [K in keyof CSSProperties]: CSSPropertyValue<K> };
};
