import type { ShadowVar } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export type ShadowProps = {
  shadow?: ShadowVar;
};

export const getShadowStyles = ({ shadow }: ShadowProps) => ({
  boxShadow: shadow && cssVar(`shadow-${shadow}`),
});
