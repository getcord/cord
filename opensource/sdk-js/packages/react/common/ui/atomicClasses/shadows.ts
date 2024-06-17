import type { ShadowVar } from '../cssVariables.js';
import { cssVar } from '../cssVariables.js';

export type ShadowProps = {
  shadow?: ShadowVar;
};

export const getShadowStyles = ({ shadow }: ShadowProps) => ({
  boxShadow: shadow && cssVar(`shadow-${shadow}`),
});
