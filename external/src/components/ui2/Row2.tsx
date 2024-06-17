import * as React from 'react';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';

/**
 * @deprecated Use a `div` with `display: flex;` (and `alignItems: 'center'` if needed)
 */
export const Row2 = React.memo(function Row2(
  props: React.PropsWithChildren<React.ComponentProps<typeof Box2>>,
) {
  return <Box2 {...props} row={true} />;
});
